"""add task recurrence

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-05-03 14:28:37.254791

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    recurrence_type = sa.Enum('none', 'daily', 'weekly', 'monthly', name='recurrence')
    recurrence_type.create(op.get_bind(), checkfirst=True)
    op.add_column('tasks', sa.Column('recurrence', recurrence_type, nullable=False, server_default='none'))


def downgrade() -> None:
    op.drop_column('tasks', 'recurrence')
    sa.Enum(name='recurrence').drop(op.get_bind(), checkfirst=True)
