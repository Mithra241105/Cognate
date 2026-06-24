import smtplib
import os
from email.message import EmailMessage
from email.utils import make_msgid, formatdate, formataddr
from dotenv import load_dotenv
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import HTTPException, status

load_dotenv()

def _get_smtp_credentials():
    return (
        os.getenv("SMTP_SERVER", "smtp.gmail.com"),
        int(os.getenv("SMTP_PORT", 465)),
        os.getenv("SMTP_USERNAME"),
        os.getenv("SMTP_PASSWORD")
    )

def _send(msg: EmailMessage, smtp_server: str, smtp_port: int, smtp_user: str, smtp_password: str):
    try:
        if smtp_port == 465:
            with smtplib.SMTP_SSL(smtp_server, smtp_port) as server:
                server.login(smtp_user, smtp_password)
                server.send_message(msg)
        else:
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.send_message(msg)
    except Exception as e:
        print(f"Failed to send email: {e}")

# ─── 1. Workspace Initialization OTP ───────────────────────────────────────────

def send_otp_email_sync(user_email: str, otp: str):
    smtp_server, smtp_port, smtp_user, smtp_password = _get_smtp_credentials()

    if not smtp_user or not smtp_password:
        print("--------------------------------------------------")
        print("WARNING: Missing SMTP credentials.")
        print(f"MOCK OTP EMAIL → {user_email}")
        print(f"OTP CODE: {otp}")
        print("--------------------------------------------------")
        return

    msg = EmailMessage()
    msg['Subject']    = "Authenticate Your Cognate Workspace"
    msg['From']       = formataddr(('Cognate Workspace', smtp_user))
    msg['Reply-To']   = smtp_user
    msg['To']         = user_email
    msg['Message-ID'] = make_msgid(domain='cognate.internal')
    msg['Date']       = formatdate(localtime=True)
    msg['Precedence'] = 'bulk'

    plain_text = f"Your Cognate verification code is: {otp}. This code expires in 10 minutes. Do not share it with anyone."
    msg.set_content(plain_text)

    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 20px;">
            <tr>
                <td align="center">
                    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:500px;background-color:#ffffff;border-radius:24px;border:1px solid #e5e7eb;padding:40px;text-align:center;">
                        <tr>
                            <td>
                                <!-- Logo Mark -->
                                <div style="margin: 0 auto 20px auto; width: 48px; height: 48px; line-height: 48px; background-color: #8a5cff; border-radius: 50%; text-align: center; color: #ffffff; font-weight: 800; font-size: 20px; font-family: sans-serif;">C</div>

                                <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1f2937;letter-spacing:-0.5px;">
                                    Workspace Initialization
                                </h1>
                                <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
                                    Your Cognate workspace is ready. Enter the code below<br>to complete identity verification and activate your session.
                                </p>

                                <!-- OTP Display Block -->
                                <div style="background-color:#f3f4f6;letter-spacing:8px;font-size:36px;font-weight:800;color:#8a5cff;padding:20px;border-radius:12px;margin:30px 0;font-variant-numeric:tabular-nums;">
                                    {otp}
                                </div>

                                <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;">
                                    &#128274; This code expires in <strong>10 minutes</strong>.
                                </p>
                                <p style="margin:0 0 32px;font-size:13px;color:#ef4444;font-weight:600;">
                                    Do not share it with anyone.
                                </p>

                                <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;">
                                <p style="margin:0;font-size:12px;color:#9ca3af;">
                                    If you did not create a Cognate account, you can safely ignore this email.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    msg.add_alternative(html_content, subtype='html')
    _send(msg, smtp_server, smtp_port, smtp_user, smtp_password)


# ─── 2. Cryptographic Key Reset OTP ────────────────────────────────────────────

def send_reset_email(to_email: str, reset_token: str):
    sender_email = os.getenv("SENDER_EMAIL")
    smtp_password = os.getenv("SMTP_PASSWORD") # Your 16-character Google App Password
    
    if not sender_email or not smtp_password:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Email configuration missing from server environment variables."
        )

    # Change this to your live production frontend domain URL
    frontend_url = "https://cognate-six.vercel.app" 
    reset_link = f"{frontend_url}/reset-password?token={reset_token}"

    # Build the HTML modern email body
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Reset Your Cognate Account Password"
    msg["From"] = f"Cognate Platform <{sender_email}>"
    msg["To"] = to_email

    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #333333; margin-bottom: 20px;">Password Reset Request</h2>
                <p style="color: #666666; font-size: 16px; line-height: 1.5;">
                    We received a request to reset your password for your Cognate account. Click the button below to set up a new password:
                </p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_link}" style="background-color: #4F46E5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                <p style="color: #999999; font-size: 14px; line-height: 1.5;">
                    If you did not request this, please ignore this email. This link will expire shortly.
                </p>
            </div>
        </body>
    </html>
    """
    msg.attach(MIMEText(html_content, "html"))

    try:
        # Connect securely over SSL to Gmail SMTP on Port 465
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, smtp_password)
            server.sendmail(sender_email, to_email, msg.as_string())
        return {"status": "success", "message": "Reset email dispatched safely."}
        
    except smtplib.SMTPAuthenticationError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SMTP Authentication failed. Verify SENDER_EMAIL and SMTP_PASSWORD secrets."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Email delivery system failure: {str(e)}"
        )


# ─── 3. Legacy Link-Based Verification (kept for compatibility) ─────────────────

def send_verification_email_sync(user_email: str, token: str):
    smtp_server, smtp_port, smtp_user, smtp_password = _get_smtp_credentials()

    link = f"http://localhost:3000/verify?token={token}"

    if not smtp_user or not smtp_password:
        print("--------------------------------------------------")
        print("WARNING: Missing SMTP credentials.")
        print(f"MOCK EMAIL → {user_email}")
        print(f"VERIFICATION LINK: {link}")
        print("--------------------------------------------------")
        return

    msg = EmailMessage()
    msg['Subject']    = "Authenticate Your Cognate Workspace"
    msg['From']       = smtp_user
    msg['To']         = user_email
    msg['Message-ID'] = make_msgid(domain='cognate.internal')
    msg['Date']       = formatdate(localtime=True)
    msg['Precedence'] = 'bulk'

    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <body style="background-color:#f3f4f6;padding:50px;font-family:-apple-system,sans-serif;text-align:center;">
        <div style="background-color:#ffffff;border-radius:24px;border:1px solid #e5e7eb;padding:40px;max-width:500px;margin:0 auto;">
            <h2 style="color:#1f2937;">Welcome to Cognate</h2>
            <p style="color:#6b7280;margin-bottom:30px;">Click below to verify your workspace identity.</p>
            <a href="{link}" style="background-color:#8a5cff;color:#ffffff;padding:15px 30px;text-decoration:none;border-radius:10px;font-weight:bold;display:inline-block;">
                Verify Email
            </a>
        </div>
    </body>
    </html>
    """

    msg.add_alternative(html_content, subtype='html')
    _send(msg, smtp_server, smtp_port, smtp_user, smtp_password)
