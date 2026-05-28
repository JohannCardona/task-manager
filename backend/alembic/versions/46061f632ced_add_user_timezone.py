"""add user timezone

Revision ID: 46061f632ced
Revises: c3d4e5f6a7b8
Create Date: 2026-05-28 17:08:47.581527

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '46061f632ced'
down_revision: Union[str, None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('timezone', sa.String(length=100), server_default='UTC', nullable=False))


def downgrade() -> None:
    op.drop_column('users', 'timezone')
