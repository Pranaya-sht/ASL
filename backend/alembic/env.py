import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from database import Base  # or your actual path to Base and models

# this is the Alembic Config object, which provides access to the values within the .ini file in use.
config = context.config

# Instead of putting the URL in alembic.ini, set it here
DATABASE_URL = "postgresql://postgres:##8888@localhost/asl_app"
config.set_main_option("sqlalchemy.url", DATABASE_URL)

# Interpret the config file for Python logging.
fileConfig(config.config_file_name)

# Add your model's MetaData object here for 'autogenerate' support
target_metadata = Base.metadata
