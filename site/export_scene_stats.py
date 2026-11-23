"""Export public aggregate counts from the local Pouët analysis for the static site."""

import csv
import json
import re
from pathlib import Path


SITE = Path(__file__).resolve().parent
ANALYSIS = SITE.parent / "analysis"
RESULTS = ANALYSIS / "results"
FORMATS = ("demo", "size_limited", "intro", "wild", "other")


def rows(path):
    with path.open(encoding="utf-8", newline="") as file:
        return list(csv.DictReader(file))


def main():
    ranking = rows(RESULTS / "platform_ranking.csv")
    main_platforms = list(dict.fromkeys([*(row["platform_id"] for row in ranking[:5]), "amigaaga"]))
    annual = {}
    for row in rows(RESULTS / "format_popularity_by_year.csv"):
        annual.setdefault(row["platform_id"], {})[row["year"]] = [
            int(row[key]) for key in ("total", *FORMATS)
        ]
    sizes = {}
    for row in rows(RESULTS / "size_tags_by_year.csv"):
        sizes.setdefault(row["platform_id"], {}).setdefault(row["size_tag"], {})[row["year"]] = int(row["releases"])

    activity = {}
    for grain in ("season", "month"):
        activity[grain] = {}
        for row in rows(RESULTS / f"releases_by_{grain}.csv"):
            period = row["period"]
            if int(period[:4]) < 2015 or period == "2015-Winter":
                continue
            series = activity[grain].setdefault(period, {"partial": row["partial_period"] == "True"})
            series[row["platform_id"]] = [int(row["releases"]), int(row["without_party_tag"])]

    parties = [
        {"kind": "party", "name": row["edition"], "start": row["start_date"], "end": row["end_date"],
         "url": row["source_url"]}
        for row in rows(ANALYSIS / "party_calendar.csv") if row["format"] != "cancelled"
    ]
    milestones = rows(ANALYSIS / "external_events.csv")
    named = {row["kind"]: row for row in milestones if row["kind"] in {"covid_start", "covid_end"}}
    covid = {"kind": "covid", "name": "WHO pandemic declaration to end of global emergency",
             "start": named["covid_start"]["date"], "end": named["covid_end"]["date"],
             "url": named["covid_start"]["source_url"]}
    launches = [
        {"kind": "llm", "name": row["event"], "start": row["date"], "end": row["date"], "url": row["source_url"]}
        for row in milestones if row["kind"] in {"chatgpt", "llm"}
    ]
    report = (RESULTS / "report.md").read_text(encoding="utf-8")
    snapshot = re.search(r"^Production snapshot .*?\((\d{4}-\d{2}-\d{2}) ", report, re.MULTILINE)
    if snapshot is None:
        raise ValueError("No production snapshot date in analysis/results/report.md")
    snapshot = snapshot[1]
    payload = {
        "snapshot": snapshot,
        "platforms": {row["platform_id"]: row["platform"] for row in ranking},
        "main": main_platforms,
        "annual": annual,
        "sizes": sizes,
        "activity": activity,
        "events": [event for event in [*parties, covid, *launches] if event["start"] <= snapshot],
    }
    (SITE / "scene-data.json").write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n",
                                         encoding="utf-8")


if __name__ == "__main__":
    main()
