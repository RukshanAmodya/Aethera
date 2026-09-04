import { Logger } from '@n8n/backend-common';
import { GlobalConfig } from '@n8n/config';
import { Service } from '@n8n/di';
import pick from 'lodash/pick';
import { ErrorReporter } from 'n8n-core';
import path from 'node:path';
import type { Transporter } from 'nodemailer';
import { createTransport } from 'nodemailer';
import type SMTPConnection from 'nodemailer/lib/smtp-connection';

import type { MailData, SendEmailResult } from './interfaces';

@Service()
export class NodeMailer {
	readonly sender: string;

	private transport: Transporter;

	constructor(
		globalConfig: GlobalConfig,
		private readonly logger: Logger,
		private readonly errorReporter: ErrorReporter,
	) {
		const smtpConfig = globalConfig.userManagement.emails.smtp;
		const transportConfig: SMTPConnection.Options = pick(smtpConfig, ['host', 'port', 'secure']);
		transportConfig.ignoreTLS = !smtpConfig.startTLS;

		const { auth } = smtpConfig;
		if (auth.user && auth.pass) {
			transportConfig.auth = pick(auth, ['user', 'pass']);
		}
		if (auth.serviceClient && auth.privateKey) {
			transportConfig.auth = {
				type: 'OAuth2',
				user: auth.user,
				serviceClient: auth.serviceClient,
				privateKey: auth.privateKey.replace(/\\n/g, '\n'),
			};
		}
		this.transport = createTransport(transportConfig);

		this.sender = smtpConfig.sender;
		if (!this.sender && auth.user.includes('@')) {
			this.sender = auth.user;
		}
		if (!this.sender) {
			this.sender = process.env.AETHERA_EMAIL_SENDER || 'Aethera Support <mail.questra@gmail.com>';
		}
	}

	async sendMail(mailData: MailData): Promise<SendEmailResult> {
		const workerUrl =
			process.env.AETHERA_EMAIL_WORKER_URL ||
			'https://aethera-email-worker.agency-digitra.workers.dev';
		const workerToken = process.env.AETHERA_WORKER_TOKEN || 'aethera_worker_secret_2026';

		const recipients = Array.isArray(mailData.emailRecipients)
			? mailData.emailRecipients.join(', ')
			: mailData.emailRecipients;

		// If SMTP transport host is configured, try SMTP first
		if (this.transport && (this.transport as any).options?.host) {
			try {
				const plainText =
					mailData.textOnly ??
					(typeof mailData.body === 'string' ? this.htmlToPlainText(mailData.body) : undefined);

				await this.transport.sendMail({
					from: this.sender,
					to: mailData.emailRecipients,
					subject: mailData.subject,
					text: plainText,
					html: mailData.body,
					attachments: [
						{
							cid: 'n8n-logo',
							filename: 'n8n-logo.png',
							path: path.resolve(__dirname, 'templates/n8n-logo.png'),
							contentDisposition: 'inline',
						},
					],
				});
				this.logger.debug(
					`Email sent successfully via SMTP to: ${mailData.emailRecipients.toString()}`,
				);
				return { emailSent: true };
			} catch (smtpError) {
				this.logger.warn('SMTP delivery failed, falling back to Aethera Email Worker', {
					error: smtpError as Error,
				});
			}
		}

		// Dispatch via Cloudflare Email Worker (backed by Google Apps Script Gmail Hub)
		try {
			const response = await fetch(workerUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${workerToken}`,
				},
				body: JSON.stringify({
					to: recipients,
					subject: mailData.subject,
					message: typeof mailData.body === 'string' ? mailData.body : mailData.body.toString('utf-8'),
					senderName: this.sender,
				}),
			});

			if (!response.ok) {
				const errText = await response.text();
				throw new Error(`Email worker responded with status ${response.status}: ${errText}`);
			}

			this.logger.info(`Email sent successfully via Aethera Email Worker to: ${recipients}`);
			return { emailSent: true };
		} catch (workerError) {
			this.errorReporter.error(workerError);
			this.logger.error('Failed to send email via both SMTP and Worker', {
				recipients: mailData.emailRecipients,
				error: workerError as Error,
			});
			throw workerError;
		}
	}

	private htmlToPlainText(html: string): string {
		return (
			html
				// Remove non-visible content
				.replace(/<head[\s\S]*?<\/head>/gi, '')
				.replace(/<script[\s\S]*?<\/script>/gi, '')
				.replace(/<style[\s\S]*?<\/style>/gi, '')
				// Convert links and buttons to "text (url)" format
				.replace(/<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
				.replace(/<mj-button\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/mj-button>/gi, '$2 ($1)')
				// Replace <br> and block-level closing tags with newlines
				.replace(/<br\s*\/?>/gi, '\n')
				.replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
				// Strip remaining HTML tags
				.replace(/<[^>]+>/g, '')
				// Decode common HTML entities
				.replace(/&amp;/g, '&')
				.replace(/&lt;/g, '<')
				.replace(/&gt;/g, '>')
				.replace(/&quot;/g, '"')
				.replace(/&#039;/g, "'")
				.replace(/&nbsp;/g, ' ')
				// Trim leading whitespace from each line
				.replace(/^[\t ]+/gm, '')
				// Collapse multiple blank lines
				.replace(/\n{3,}/g, '\n\n')
				.trim()
		);
	}
}
