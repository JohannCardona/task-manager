"""add task notes

Revision ID: d7e8f9a0b1c2
Revises: 46061f632ced
Create Date: 2026-06-09 10

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd7e8f9a0b1c2'
down_revision: Union[str, None] = '46061f632ced'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('tasks', sa.Column('notes', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('tasks', 'notes')
