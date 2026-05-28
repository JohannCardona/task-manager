import logging
from datetime import datetime, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from apscheduler.schedulers.background import BackgroundScheduler

from app.core.database import SessionLocal
from app.core.email import send_deadline_reminder
from app.models.task import Task
from app.models.user import User

logger = logging.getLogger(__name__)


def send_deadline_reminders() -> None:
    db = SessionLocal()
    try:
        now_utc = datetime.now(timezone.utc)
        users: list[User] = db.query(User).filter(User.is_active.is_(True)).all()

        for user in users:
            try:
                tz = ZoneInfo(user.timezone or "UTC")
            except ZoneInfoNotFoundError:
                tz = ZoneInfo("UTC")

            now_local = now_utc.astimezone(tz)
            if now_local.hour != 8:
                continue

            today_start = now_local.replace(hour=0, minute=0, second=0, microsecond=0)
            today_end = now_local.replace(hour=23, minute=59, second=59, microsecond=999999)

            tasks: list[Task] = (
                db.query(Task)
                .filter(Task.owner_id == user.id, Task.is_completed.is_(False), Task.deadline.isnot(None))
                .all()
            )

            overdue: list[str] = []
            due_today: list[str] = []

            for task in tasks:
                dl = task.deadline
                if dl.tzinfo is None:
                    dl = dl.replace(tzinfo=timezone.utc)
                dl_local = dl.astimezone(tz)
                if dl_local < today_start:
                    overdue.append(task.title)
                elif today_start <= dl_local <= today_end:
                    due_today.append(task.title)

            if overdue or due_today:
                try:
                    send_deadline_reminder(user.email, user.username, overdue, due_today)
                    logger.info("Reminder sent to %s", user.email)
                except Exception:
                    logger.exception("Failed to send reminder to %s", user.email)
    finally:
        db.close()


def create_scheduler() -> BackgroundScheduler:
    scheduler = BackgroundScheduler(timezone="UTC")
    scheduler.add_job(send_deadline_reminders, "interval", hours=1)
    return scheduler
