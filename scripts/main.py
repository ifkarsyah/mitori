from datetime import datetime
import os
import re
import time
from urllib.parse import urlparse

# Third-party libraries managed by uv
from bs4 import BeautifulSoup
import requests

# --- CONFIGURATION: PUT YOUR URLS HERE, GROUPED BY CATEGORY ---
# The dict key becomes the output subfolder name.
URLS = {
    "data-governance": [
        "https://www.conduktor.io/glossary/data-drift-in-streaming",
        "https://www.conduktor.io/glossary/data-freshness-monitoring-sla-management",
        "https://www.conduktor.io/glossary/data-governance-framework-roles-and-responsibilities",
        "https://www.conduktor.io/glossary/data-lineage-tracking-data-from-source-to-consumption",
        "https://www.conduktor.io/glossary/data-masking-and-anonymization-for-streaming",
        "https://www.conduktor.io/glossary/data-mesh-principles-and-implementation",
        "https://www.conduktor.io/glossary/data-quality-vs-data-observability-key-differences",
        "https://www.conduktor.io/glossary/data-quality-incidents",
        "https://www.conduktor.io/glossary/dbt-tests-and-data-quality-checks",
        "https://www.conduktor.io/glossary/gdpr-compliance-for-data-teams",
    ],
    "table-format-iceberg-delta": [
        "https://www.conduktor.io/glossary/delta-lake-deletion-vectors-efficient-row-level-deletes",
        "https://www.conduktor.io/glossary/delta-lake-liquid-clustering-modern-partitioning",
        "https://www.conduktor.io/glossary/delta-lake-transaction-log-how-it-works",
        "https://www.conduktor.io/glossary/iceberg-catalog-management-hive-glue-and-nessie",
        "https://www.conduktor.io/glossary/iceberg-table-architecture-metadata-and-snapshots",
        "https://www.conduktor.io/glossary/kafka-to-iceberg-topics",
        "https://www.conduktor.io/glossary/maintaining-iceberg-tables-compaction-and-cleanup",
        "https://www.conduktor.io/glossary/optimizing-delta-tables-optimize-and-z-order",

    ],
    "format-and-schema": [
        "https://www.conduktor.io/glossary/avro-vs-protobuf-vs-json-schema",
        "https://www.conduktor.io/glossary/data-versioning-in-streaming",
        "https://www.conduktor.io/glossary/data-contracts-for-reliable-pipelines",
        "https://www.conduktor.io/glossary/message-serialization-in-kafka",
        "https://www.conduktor.io/glossary/schema-evolution-in-apache-iceberg",
        "https://www.conduktor.io/glossary/schema-evolution-best-practices",
        "https://www.conduktor.io/glossary/schema-registry-and-schema-management",
        "https://www.conduktor.io/glossary/streaming-to-lakehouse-tables",

    ],
    "architecture": [
        "https://www.conduktor.io/glossary/data-lake-zones-bronze-silver-gold-architecture",
        "https://www.conduktor.io/glossary/data-obesity",
        "https://www.conduktor.io/glossary/kafka-vs-postgres",
        "https://www.conduktor.io/glossary/saga-pattern-for-distributed-transactions",
        "https://www.conduktor.io/glossary/streaming-ingestion-to-lakehouse",
    ],
    "streaming": [
        "https://www.conduktor.io/glossary/backpressure-handling-in-streaming-systems",
        "https://www.conduktor.io/glossary/data-pipeline-orchestration-with-streaming",
        "https://www.conduktor.io/glossary/streaming-data-pipeline",
        "https://www.conduktor.io/glossary/streaming-data-product-asset",
        "https://www.conduktor.io/glossary/sla-for-streaming",
    ],
    "streaming-usecase": [
        "https://www.conduktor.io/glossary/building-recommendation-systems-with-streaming-data",
        "https://www.conduktor.io/glossary/clickstream-analytics-with-kafka",
        "https://www.conduktor.io/glossary/cqrs-and-event-sourcing-with-kafka",
        "https://www.conduktor.io/glossary/log-aggregation-with-kafka",
        "https://www.conduktor.io/glossary/real-time-fraud-detection-with-streaming",
        "https://www.conduktor.io/glossary/real-time-gaming-analytics-with-streaming",
        "https://www.conduktor.io/glossary/real-time-ml-inference-with-streaming-data",
        "https://www.conduktor.io/glossary/real-time-ml-pipelines",
        "https://www.conduktor.io/glossary/real-time-threat-detection",

    ],
    "cdc": [
        "https://www.conduktor.io/glossary/cdc-for-microservices-event-driven-architectures",
        "https://www.conduktor.io/glossary/cdc-for-real-time-data-warehousing",
        "https://www.conduktor.io/glossary/implementing-cdc-with-debezium",
        "https://www.conduktor.io/glossary/log-based-vs-query-based-cdc-comparison",
        "https://www.conduktor.io/glossary/outbox-pattern-for-reliable-event-publishing",
        "https://www.conduktor.io/glossary/what-is-change-data-capture-cdc-fundamentals",

    ],
    "infra": [
        "https://www.conduktor.io/glossary/data-incident-management-and-root-cause-analysis",
        "https://www.conduktor.io/glossary/dead-letter-queues-for-error-handling",
        "https://www.conduktor.io/glossary/disaster-recovery-strategies-for-kafka-clusters",
        "https://www.conduktor.io/glossary/distributed-tracing-for-kafka-applications",

    ],
    "kafka-for-sre": [
        "https://www.conduktor.io/glossary/diskless-kafka",
        "https://www.conduktor.io/glossary/kafka-acls-and-authorization-patterns",
        "https://www.conduktor.io/glossary/kafka-admin-operations-and-maintenance",
        "https://www.conduktor.io/glossary/kafka-authentication-sasl-ssl-oauth",
        "https://www.conduktor.io/glossary/kafka-backup-vs-replication",
        "https://www.conduktor.io/glossary/kafka-capacity-planning",
        "https://www.conduktor.io/glossary/kafka-cluster-monitoring-and-metrics",
        "https://www.conduktor.io/glossary/consumer-lag-monitoring",
        "https://www.conduktor.io/glossary/kafka-performance-tuning-guide",
        "https://www.conduktor.io/glossary/kafka-replication-and-high-availability",
        "https://www.conduktor.io/glossary/kafka-security-best-practices",
        "https://www.conduktor.io/glossary/running-kafka-on-kubernetes",
        "https://www.conduktor.io/glossary/strimzi-kafka-operator-for-kubernetes",
        "https://www.conduktor.io/glossary/understanding-kraft-mode-in-kafka",
        "https://www.conduktor.io/glossary/zookeeper-to-kraft-migration",
        "https://www.conduktor.io/glossary/streaming-total-cost-of-ownership",
        "https://www.conduktor.io/glossary/tiered-storage-in-kafka",
    ],
    "kafka-for-backend": [
        "https://www.conduktor.io/glossary/kafka-architecture-diagram",
        "https://www.conduktor.io/glossary/kafka-connect-single-message-transforms",
        "https://www.conduktor.io/glossary/kafka-connect-building-data-integration-pipelines",
        "https://www.conduktor.io/glossary/kafka-consumer-groups-explained",
        "https://www.conduktor.io/glossary/exactly-once-semantics-in-kafka",
        "https://www.conduktor.io/glossary/kafka-log-compaction-explained",
        "https://www.conduktor.io/glossary/kafka-partitioning-strategies-and-best-practices",
        "https://www.conduktor.io/glossary/kafka-producers",
        "https://www.conduktor.io/glossary/kafka-producers-and-consumers",
        "https://www.conduktor.io/glossary/kafka-share-groups",
        "https://www.conduktor.io/glossary/kafka-topic-design-guidelines",
        "https://www.conduktor.io/glossary/kafka-transactions-deep-dive",
        "https://www.conduktor.io/glossary/kafka-partitions-explained",
        "https://www.conduktor.io/glossary/kafka-topics-explained",
        "https://www.conduktor.io/glossary/kafka-brokers-explained",
    ],
    "flink": [
        "https://www.conduktor.io/glossary/what-is-apache-flink-stateful-stream-processing",
        "https://www.conduktor.io/glossary/event-time-and-watermarks-in-flink",
        "https://www.conduktor.io/glossary/flink-datastream-api-building-streaming-applications",
        "https://www.conduktor.io/glossary/flink-sql-and-table-api-for-stream-processing",
        "https://www.conduktor.io/glossary/flink-state-management-and-checkpointing",
        "https://www.conduktor.io/glossary/flink-vs-kafka-streams",
        "https://www.conduktor.io/glossary/session-windows-in-stream-processing",
        "https://www.conduktor.io/glossary/watermarks-and-triggers-in-stream-processing",
        "https://www.conduktor.io/glossary/windowing-in-apache-flink-tumbling-sliding-and-session-windows",
    ],
}

PROJECT_PATH = "/Users/ifkarsyah/Developments/2_portofolio/ninshu"
BLOG_PATH = f"{PROJECT_PATH}/bookmark/article/blog/conduktor"

# -----------------------------------------


def detect_paywall(html_text):
    """Checks the raw response text for common premium paywall phrases."""
    paywall_signatures = [
        "you just read the free excerpt",
        "the full analysis continues on substack",
        "to read the rest of this story, start your free trial",
        "this post is for paid subscribers",
        "become a member to read the full story",
    ]

    # Convert everything to lowercase for a reliable check
    html_lower = html_text.lower()
    for phrase in paywall_signatures:
        if phrase in html_lower:
            return "paid"

    return "free"


def clean_filename(title):
    """Turns 'Design Patterns Suck' into 'design-patterns-suck.md'"""
    filename = title.lower().strip()
    filename = re.sub(r"[^\w\s-]", "", filename)  # Remove punctuation
    filename = re.sub(
        r"[\s_-]+", "-", filename
    )  # Replace spaces/underscores with hyphens
    return f"{filename}.md"


def scrape_url(url, category, headers):
    """Fetches a single URL and writes it to BLOG_PATH/<category>/<slug>.md"""
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
    except Exception as e:
        print(f" ❌ Error fetching URL: {e}\n")
        return

    # Check for paywalled text immediately
    access_status = detect_paywall(response.text)

    # Parse the HTML
    soup = BeautifulSoup(response.text, "html.parser")

    # Extract Blog Domain
    parsed_url = urlparse(url)
    blog_domain = parsed_url.netloc

    # Extract Title
    h1_tag = soup.find("h1")
    title = h1_tag.text.strip() if h1_tag else soup.title.text.strip()

    # Extract True Published Date
    published_date = None

    # 1. Check for standard meta tags
    date_meta = soup.find("meta", property="article:published_time") or soup.find(
        "meta", attrs={"name": "date"}
    )
    if date_meta and date_meta.get("content"):
        published_date = date_meta["content"][:10]

    # 2. Fallback: Check for HTML5 <time> elements (used by luminousmen)
    if not published_date:
        time_tag = soup.find("time")
        if time_tag and time_tag.get("datetime"):
            published_date = time_tag["datetime"][:10]
        elif time_tag:
            published_date = time_tag.text.strip()[:10]

    # 3. Last resort: use today's date
    if not published_date:
        published_date = datetime.today().strftime("%Y-%m-%d")

    # Extract Body Content
    content_div = soup.find("article") or soup.find("main") or soup.find("body")
    if content_div:
        paragraphs = [
            p.text.strip() for p in content_div.find_all(["p", "h2", "h3"])
        ]
        body_content = "\n\n".join(p for p in paragraphs if p)
    else:
        body_content = "Could not automatically isolate the body text."

    # Format Markdown with dynamically adjusted access status
    markdown_content = f"""---
title: {title.lower().replace(' ', '-')}
url: {url}
published: {published_date}
blog: {blog_domain}
access: {access_status}
domain: backend
tool: NA
category: {category}
---

# {title}

{body_content}
"""

    # Output folder is derived per category
    output_folder = os.path.join(BLOG_PATH, category)
    os.makedirs(output_folder, exist_ok=True)

    filename = os.path.join(output_folder, clean_filename(title))
    try:
        with open(filename, "w", encoding="utf-8") as f:
            f.write(markdown_content)
        print(f" Saved as '{filename}' (Access: {access_status})")
    except Exception as e:
        print(f" ❌ Error writing file: {e}")


def scrape_multiple_urls():
    if not URLS:
        print("The URLS dict is empty! Please add some URLs at the top of the file.")
        return

    # Set up headers to look like a normal web browser
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    total = sum(len(urls) for urls in URLS.values())
    print(f"Starting batch process for {total} URL(s) across {len(URLS)} categories...\n")

    count = 0
    for category, urls in URLS.items():
        print(f"=== Category: {category} ===")
        for url in urls:
            url = url.strip()
            if not url:
                continue

            count += 1
            print(f"[{count}/{total}] Fetching: {url}")
            scrape_url(url, category, headers)

            # Polite 1-second pause between requests to not overwhelm the servers
            if count < total:
                time.sleep(1)
        print()

    print("All done!")


if __name__ == "__main__":
    scrape_multiple_urls()