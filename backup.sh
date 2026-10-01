#!/bin/bash

# ═══════════════════════════════════════════════════════
#  EnVision Foundation - MongoDB Backup Script
#  Run: chmod +x backup.sh && ./backup.sh
#  Cron: 0 2 * * * /path/to/backup.sh >> /path/to/backup.log 2>&1
# ═══════════════════════════════════════════════════════

# Configuration
DB_NAME="ngo-staff-management"
BACKUP_DIR="./backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_PATH="${BACKUP_DIR}/${DB_NAME}_${DATE}"
MAX_BACKUPS=30  # Keep last 30 backups

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}  EnVision Foundation - Database Backup${NC}"
echo -e "${GREEN}  Date: ${DATE}${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"

# Create backup directory if not exists
mkdir -p "${BACKUP_DIR}"

# Check if mongodump is available
if ! command -v mongodump &> /dev/null; then
    echo -e "${RED}Error: mongodump not found. Install MongoDB Database Tools.${NC}"
    echo "  brew install mongodb-database-tools"
    exit 1
fi

# Run mongodump
echo -e "${YELLOW}Starting backup...${NC}"
mongodump --db="${DB_NAME}" --out="${BACKUP_PATH}" --quiet

if [ $? -eq 0 ]; then
    # Compress the backup
    echo -e "${YELLOW}Compressing backup...${NC}"
    tar -czf "${BACKUP_PATH}.tar.gz" -C "${BACKUP_DIR}" "${DB_NAME}_${DATE}"
    rm -rf "${BACKUP_PATH}"

    BACKUP_SIZE=$(du -h "${BACKUP_PATH}.tar.gz" | cut -f1)
    echo -e "${GREEN}✅ Backup successful!${NC}"
    echo -e "   File: ${BACKUP_PATH}.tar.gz"
    echo -e "   Size: ${BACKUP_SIZE}"

    # Cleanup old backups (keep last MAX_BACKUPS)
    BACKUP_COUNT=$(ls -1 "${BACKUP_DIR}"/*.tar.gz 2>/dev/null | wc -l | tr -d ' ')
    if [ "${BACKUP_COUNT}" -gt "${MAX_BACKUPS}" ]; then
        REMOVE_COUNT=$((BACKUP_COUNT - MAX_BACKUPS))
        echo -e "${YELLOW}Cleaning up ${REMOVE_COUNT} old backup(s)...${NC}"
        ls -1t "${BACKUP_DIR}"/*.tar.gz | tail -n "${REMOVE_COUNT}" | xargs rm -f
    fi

    echo -e "${GREEN}Total backups: $(ls -1 "${BACKUP_DIR}"/*.tar.gz 2>/dev/null | wc -l | tr -d ' ')${NC}"
else
    echo -e "${RED}❌ Backup failed!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""

# ═══════════════════════════════════════════════════════
#  RESTORE INSTRUCTIONS:
#  1. Extract: tar -xzf backup_file.tar.gz
#  2. Restore: mongorestore --db=ngo-staff-management ./ngo-staff-management/
# ═══════════════════════════════════════════════════════
