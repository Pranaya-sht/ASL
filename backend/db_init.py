# db_init.py
from sqlalchemy import create_engine
from models import Base  # wherever your Base and models are defined

DATABASE_URL = "postgresql://postgres:##8888@localhost/asl_app"
engine = create_engine(DATABASE_URL)

Base.metadata.create_all(bind=engine)
