import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.attachment import Attachment
from app.models.user import User
from app.schemas.attachment import AttachmentOut
from app.api._utils import get_owned_task

router = APIRouter(prefix="/tasks/{task_id}/attachments", tags=["attachments"])


def _upload_dir() -> Path:
    path = Path(settings.upload_dir)
    path.mkdir(parents=True, exist_ok=True)
    return path


@router.post("/", response_model=AttachmentOut, status_code=status.HTTP_201_CREATED)
async def upload_attachment(
    task_id: int,
    file: UploadFile,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Attachment:
    get_owned_task(task_id, current_user, db)

    max_size = settings.max_upload_size_mb * 1024 * 1024
    contents = await file.read()
    if len(contents) > max_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds the {settings.max_upload_size_mb}MB limit",
        )

    original_name = file.filename or "file"
    stored_filename = f"{uuid.uuid4().hex}_{original_name}"
    (_upload_dir() / stored_filename).write_bytes(contents)

    attachment = Attachment(
        task_id=task_id,
        filename=original_name,
        stored_filename=stored_filename,
        content_type=file.content_type or "application/octet-stream",
        size=len(contents),
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return attachment


@router.get("/{attachment_id}/download")
def download_attachment(
    task_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FileResponse:
    get_owned_task(task_id, current_user, db)
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id, Attachment.task_id == task_id).first()
    if not attachment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attachment not found")

    file_path = _upload_dir() / attachment.stored_filename
    if not file_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found on server")

    return FileResponse(file_path, filename=attachment.filename, media_type=attachment.content_type)


@router.delete("/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attachment(
    task_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    get_owned_task(task_id, current_user, db)
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id, Attachment.task_id == task_id).first()
    if not attachment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attachment not found")

    file_path = _upload_dir() / attachment.stored_filename
    file_path.unlink(missing_ok=True)

    db.delete(attachment)
    db.commit()
