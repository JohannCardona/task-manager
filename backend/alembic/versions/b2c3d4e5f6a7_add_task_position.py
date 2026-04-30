"""add task position

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-04-29 18:47:15.267354

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('tasks', sa.Column('position', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_tasks_position'), 'tasks', ['position'], unique=False)
    op.execute('UPDATE tasks SET position = id')


def downgrade() -> None:
    op.drop_index(op.f('ix_tasks_position'), table_name='tasks')
    op.drop_column('tasks', 'position')
