-- Duplicate sets can already exist: before this index, an id-less tire set in the
-- condition PATCH always created a new row. Keep the set with the most tires
-- (the one the assessor actually filled in), lowest id on a tie; the rest and
-- their tires (cascade) go, or the unique index below cannot be built.
DELETE FROM "TireSet"
WHERE "id" IN (
    SELECT "id" FROM (
        SELECT ts."id",
               ROW_NUMBER() OVER (
                   PARTITION BY ts."conditionId", ts."setNumber"
                   ORDER BY (SELECT COUNT(*) FROM "Tire" t WHERE t."tireSetId" = ts."id") DESC, ts."id"
               ) AS rank
        FROM "TireSet" ts
    ) ranked
    WHERE ranked.rank > 1
);

-- DropIndex
DROP INDEX "TireSet_conditionId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "TireSet_conditionId_setNumber_key" ON "TireSet"("conditionId", "setNumber");
