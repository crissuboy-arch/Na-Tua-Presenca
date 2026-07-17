import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.database import SessionLocal, engine, Base
from app.models.devotional import Devotional

Base.metadata.create_all(bind=engine)

JSON_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "devocionais.json")

def seed():
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    db = SessionLocal()
    try:
        existing = db.query(Devotional).count()
        if existing > 0:
            print(f"DB ja tem {existing} devocionais. Pulando seed.")
            return

        for item in data:
            devo = Devotional(
                day=item["day"],
                month=item["month"],
                week=item["week"],
                title=item["title"],
                verse=item.get("verse", ""),
                reference=item.get("reference", ""),
                reflection=item.get("reflection", ""),
                prayer=item.get("prayer", ""),
                challenge=item.get("challenge", ""),
                journal_prompt=item.get("journalPrompt", "")
            )
            db.add(devo)

        db.commit()
        print(f"Seed concluido: {len(data)} devocionais importados")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
