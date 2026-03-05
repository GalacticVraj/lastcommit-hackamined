const prisma = require('./prisma');

/**
 * Generate auto-numbered document ID
 * e.g., INQ-2024-00001, QT-2024-00001, SO-2024-00001
 * Uses DB transaction to prevent race conditions
 */
async function generateDocNumber(docType, prefix) {
    const year = new Date().getFullYear();

    const result = await prisma.$transaction(async (tx) => {
        let seq = await tx.docSequence.findUnique({ where: { docType } });

        if (!seq || seq.year !== year) {
            // Reset counter for a new year or create new entry
            if (seq) {
                await tx.docSequence.update({
                    where: { docType },
                    data: { year, lastNo: 1 }
                });
            } else {
                seq = await tx.docSequence.create({
                    data: { docType, prefix, year, lastNo: 1 }
                });
            }
            return `${prefix}-${year}-00001`;
        }

        // Atomic increment handles concurrency perfectly
        const updatedSeq = await tx.docSequence.update({
            where: { docType },
            data: { lastNo: { increment: 1 } }
        });

        return `${prefix}-${year}-${String(updatedSeq.lastNo).padStart(5, '0')}`;
    });

    return result;
}

module.exports = { generateDocNumber };
