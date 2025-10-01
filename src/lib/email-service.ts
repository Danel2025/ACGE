/**
 * Service d'envoi d'emails pour les quitus
 *
 * Note: Ce service nécessite la configuration d'un provider email
 * (Resend, SendGrid, AWS SES, etc.)
 */

interface EmailOptions {
  to: string
  subject: string
  html: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType: string
  }>
}

/**
 * Envoie un email avec le quitus en pièce jointe
 */
export async function sendQuitusEmail(
  recipientEmail: string,
  recipientName: string,
  quitusData: any,
  pdfBuffer?: Buffer
): Promise<{ success: boolean; error?: string }> {
  try {
    // Vérifier si un service email est configuré
    const emailProvider = process.env.EMAIL_PROVIDER // 'resend', 'sendgrid', etc.

    if (!emailProvider) {
      console.warn('⚠️ Aucun provider email configuré, email non envoyé')
      return {
        success: false,
        error: 'Service email non configuré'
      }
    }

    const emailContent = generateQuitusEmailHTML(recipientName, quitusData)

    const emailOptions: EmailOptions = {
      to: recipientEmail,
      subject: `Quitus généré - ${quitusData.numeroQuitus}`,
      html: emailContent,
      attachments: pdfBuffer ? [{
        filename: `quitus-${quitusData.numeroQuitus}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }] : undefined
    }

    // Appeler le provider email approprié
    switch (emailProvider) {
      case 'resend':
        return await sendWithResend(emailOptions)
      case 'sendgrid':
        return await sendWithSendGrid(emailOptions)
      default:
        console.warn(`⚠️ Provider email non supporté: ${emailProvider}`)
        return {
          success: false,
          error: 'Provider email non supporté'
        }
    }
  } catch (error) {
    console.error('❌ Erreur envoi email quitus:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }
  }
}

/**
 * Génère le contenu HTML de l'email
 */
function generateQuitusEmailHTML(recipientName: string, quitusData: any): string {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-quitus/${quitusData.numeroQuitus}?hash=${quitusData.securite.hash}`

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Quitus Généré</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h1 style="color: #1a56db; margin-top: 0;">Quitus Généré</h1>
        <p>Bonjour ${recipientName},</p>
        <p>Nous avons le plaisir de vous informer que le quitus pour votre dossier a été généré avec succès.</p>
      </div>

      <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h2 style="color: #1f2937; font-size: 18px; margin-top: 0;">Informations du Quitus</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Numéro de quitus:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${quitusData.numeroQuitus}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Dossier:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${quitusData.dossier.numero}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Bénéficiaire:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${quitusData.dossier.beneficiaire}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Date de génération:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${new Date(quitusData.dateGeneration).toLocaleDateString('fr-FR')}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Statut:</strong></td>
            <td style="padding: 8px 0;">
              <span style="background-color: ${quitusData.conclusion.conforme ? '#d1fae5' : '#fee2e2'}; color: ${quitusData.conclusion.conforme ? '#065f46' : '#991b1b'}; padding: 4px 12px; border-radius: 4px; font-weight: bold;">
                ${quitusData.conclusion.conforme ? 'CONFORME' : 'NON CONFORME'}
              </span>
            </td>
          </tr>
        </table>
      </div>

      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
        <h3 style="color: #1e40af; font-size: 16px; margin-top: 0;">🔒 Vérification de l'authenticité</h3>
        <p style="margin-bottom: 10px;">Pour vérifier l'authenticité de ce document, cliquez sur le lien ci-dessous :</p>
        <a href="${verificationUrl}" style="display: inline-block; background-color: #1a56db; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: bold;">
          Vérifier le quitus
        </a>
      </div>

      <div style="background-color: #f3f4f6; border-radius: 8px; padding: 15px; font-size: 12px; color: #6b7280;">
        <p style="margin: 0;"><strong>Agence Comptable des Grandes Écoles (ACGE)</strong></p>
        <p style="margin: 5px 0 0 0;">Libreville, Gabon</p>
        <p style="margin: 10px 0 0 0; font-size: 11px;">
          Cet email a été généré automatiquement. Veuillez ne pas y répondre.
        </p>
      </div>
    </body>
    </html>
  `
}

/**
 * Envoie via Resend (https://resend.com)
 */
async function sendWithResend(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY

    if (!RESEND_API_KEY) {
      return { success: false, error: 'RESEND_API_KEY manquante' }
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'noreply@acge.ga',
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ Erreur Resend:', error)
      return { success: false, error: `Resend error: ${error}` }
    }

    console.log('✅ Email envoyé via Resend à:', options.to)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur Resend'
    }
  }
}

/**
 * Envoie via SendGrid (https://sendgrid.com)
 */
async function sendWithSendGrid(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY

    if (!SENDGRID_API_KEY) {
      return { success: false, error: 'SENDGRID_API_KEY manquante' }
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SENDGRID_API_KEY}`
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: options.to }]
        }],
        from: { email: process.env.EMAIL_FROM || 'noreply@acge.ga' },
        subject: options.subject,
        content: [{ type: 'text/html', value: options.html }],
        attachments: options.attachments?.map(att => ({
          content: att.content.toString('base64'),
          filename: att.filename,
          type: att.contentType,
          disposition: 'attachment'
        }))
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ Erreur SendGrid:', error)
      return { success: false, error: `SendGrid error: ${error}` }
    }

    console.log('✅ Email envoyé via SendGrid à:', options.to)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur SendGrid'
    }
  }
}
