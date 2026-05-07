import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings


def send_deadline_reminder(to_email: str, username: str, overdue: list[str], due_today: list[str]) -> None:
    if not settings.email_notifications_enabled or not settings.smtp_username:
        return

    subject = "Task Manager — Deadline Reminder"

    lines: list[str] = [f"Hi {username},\n"]

    if overdue:
        lines.append("Overdue tasks:")
        for t in overdue:
            lines.append(f"  • {t}")
        lines.append("")

    if due_today:
        lines.append("Due today:")
        for t in due_today:
            lines.append(f"  • {t}")
        lines.append("")

    lines.append("Log in to your task manager to take action.")
    body = "\n".join(lines)

    msg = MIMEMultipart()
    msg["From"] = settings.smtp_from or settings.smtp_username
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        server.ehlo()
        server.starttls()
        server.login(settings.smtp_username, settings.smtp_password)
        server.sendmail(msg["From"], to_email, msg.as_string())
