-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PEKERJA', 'PENGAWAS', 'HSE', 'PJO', 'MGMT', 'SO', 'AUD');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'INVESTIGATING', 'REPORT_DRAFT', 'HSE_REVIEW', 'FINAL', 'REPORTED', 'CLOSED', 'VOID');

-- CreateEnum
CREATE TYPE "InvestigationStatus" AS ENUM ('OPEN', 'REPORT_DRAFT', 'HSE_REVIEW', 'FINAL');

-- CreateEnum
CREATE TYPE "CapaStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'AWAITING_VERIFICATION', 'CLOSED', 'REOPENED');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('SCHEDULED', 'DONE', 'FOLLOW_UP', 'CLOSED');

-- CreateEnum
CREATE TYPE "ProactiveStatus" AS ENUM ('NEW', 'ACKNOWLEDGED', 'ACTIONED', 'CLOSED');

-- CreateTable
CREATE TABLE "EnumMaster" (
    "id" TEXT NOT NULL,
    "groupKey" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,
    "labelEn" TEXT,
    "parentKey" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "regulatory" BOOLEAN NOT NULL DEFAULT false,
    "sourceCitation" TEXT,
    "activeFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activeTo" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnumMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RclConstant" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "citation" TEXT NOT NULL,
    "urlJdih" TEXT,
    "sha256Doc" TEXT,
    "tglVerifikasi" TIMESTAMP(3),
    "verifier" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_TRANSCRIPTION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RclConstant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sequencer" (
    "id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "yearMonth" TEXT NOT NULL,
    "lastValue" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Sequencer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iupNo" TEXT,
    "kttName" TEXT,
    "reportTemplateRef" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tz" TEXT NOT NULL DEFAULT 'Asia/Jakarta',
    "shifts" JSONB NOT NULL DEFAULT '[{"code":"DAY","label":"Day","start":"07:00","end":"15:00"},{"code":"SWING","label":"Swing","start":"15:00","end":"23:00"},{"code":"NIGHT","label":"Night","start":"23:00","end":"07:00"}]',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "areaType" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Worker" (
    "id" TEXT NOT NULL,
    "nik" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dept" TEXT,
    "position" TEXT,
    "empStatus" TEXT NOT NULL,
    "hireDate" TIMESTAMP(3),
    "dob" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Worker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerDeployment" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "startD" TIMESTAMP(3) NOT NULL,
    "endD" TIMESTAMP(3),
    "roleAtSite" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "WorkerDeployment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "no" TEXT,
    "issuer" TEXT,
    "expiryD" TIMESTAMP(3),
    "file" TEXT,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "unitCode" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "make" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'AKTIF',

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentDeployment" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "startD" TIMESTAMP(3) NOT NULL,
    "endD" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "EquipmentDeployment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceEvent" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "dt" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "desc" TEXT,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "woRef" TEXT,

    CONSTRAINT "MaintenanceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAccount" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "humanNo" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "locationId" TEXT,
    "title" TEXT NOT NULL,
    "incidentDt" TIMESTAMP(3) NOT NULL,
    "shift" TEXT NOT NULL,
    "workDayNo" INTEGER,
    "workdayRefWorkerId" TEXT,
    "weather" TEXT,
    "regType" TEXT NOT NULL,
    "kbSpecCode" TEXT,
    "mgmtCategory" TEXT NOT NULL,
    "indClass" TEXT NOT NULL,
    "regClass" TEXT NOT NULL,
    "potentialSev" INTEGER NOT NULL,
    "hipo" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT NOT NULL,
    "preservation" JSONB NOT NULL DEFAULT '{}',
    "supervisorId" TEXT,
    "picId" TEXT,
    "statsIncluded" BOOLEAN NOT NULL DEFAULT true,
    "duplicateOf" TEXT,
    "amendmentRef" TEXT,
    "voidReason" TEXT,
    "status" "IncidentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "deviceTs" TIMESTAMP(3),
    "gpsLat" DOUBLE PRECISION,
    "gpsLng" DOUBLE PRECISION,
    "gpsAccuracy" DOUBLE PRECISION,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentVictim" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "expY" INTEGER NOT NULL DEFAULT 0,
    "expM" INTEGER NOT NULL DEFAULT 0,
    "bodyPart" TEXT,
    "injuryType" TEXT,
    "outcome" TEXT,
    "lostDays" INTEGER NOT NULL DEFAULT 0,
    "ongoing" BOOLEAN NOT NULL DEFAULT false,
    "facility" TEXT,
    "restricted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "IncidentVictim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentWitness" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "statement" TEXT,
    "file" TEXT,

    CONSTRAINT "IncidentWitness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentTimeline" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL,
    "event" TEXT NOT NULL,

    CONSTRAINT "IncidentTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentEvidence" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "file" TEXT NOT NULL,
    "sha256" TEXT,
    "gpsLat" DOUBLE PRECISION,
    "gpsLng" DOUBLE PRECISION,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentEquipment" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,

    CONSTRAINT "IncidentEquipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investigation" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'SCAT',
    "startDt" TIMESTAMP(3) NOT NULL,
    "leadId" TEXT NOT NULL,
    "members" JSONB NOT NULL DEFAULT '[]',
    "rootCause" TEXT,
    "findings" TEXT,
    "qualityReview" JSONB NOT NULL DEFAULT '{}',
    "status" "InvestigationStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Investigation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScatEntry" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "note" TEXT NOT NULL,

    CONSTRAINT "ScatEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Amendment" (
    "id" TEXT NOT NULL,
    "targetEntity" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "rev" INTEGER NOT NULL,
    "delta" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "requester" TEXT NOT NULL,
    "approver" TEXT,
    "dt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "incidentId" TEXT,

    CONSTRAINT "Amendment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Capa" (
    "id" TEXT NOT NULL,
    "humanNo" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceRef" TEXT,
    "incidentId" TEXT,
    "action" TEXT NOT NULL,
    "controlType" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "picId" TEXT NOT NULL,
    "dueD" TIMESTAMP(3) NOT NULL,
    "status" "CapaStatus" NOT NULL DEFAULT 'OPEN',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "evidence" JSONB NOT NULL DEFAULT '[]',
    "verifierId" TEXT,
    "verifyDt" TIMESTAMP(3),
    "verifyResult" TEXT,
    "reopenCount" INTEGER NOT NULL DEFAULT 0,
    "recurrenceFlag" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Capa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionTemplate" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "items" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "InspectionTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionRecord" (
    "id" TEXT NOT NULL,
    "humanNo" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "equipmentId" TEXT,
    "siteId" TEXT NOT NULL,
    "locationId" TEXT,
    "performerId" TEXT NOT NULL,
    "dt" TIMESTAMP(3) NOT NULL,
    "status" "InspectionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "followupRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InspectionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionItem" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "itemCode" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "note" TEXT,
    "photo" TEXT,
    "sev" INTEGER,

    CONSTRAINT "InspectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProactiveReport" (
    "id" TEXT NOT NULL,
    "humanNo" TEXT NOT NULL,
    "reporterId" TEXT,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "sealedContact" TEXT,
    "siteId" TEXT NOT NULL,
    "locationId" TEXT,
    "category" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "photo" TEXT,
    "suggestion" TEXT,
    "status" "ProactiveStatus" NOT NULL DEFAULT 'NEW',
    "responseDt" TIMESTAMP(3),
    "slaFlag" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProactiveReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegReport" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "clientId" TEXT,
    "period" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "file" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "sentDt" TIMESTAMP(3),
    "channel" TEXT,
    "recipient" TEXT,
    "receiptRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiSnapshot" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "siteId" TEXT,
    "period" TEXT NOT NULL,
    "manHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "leading" JSONB NOT NULL DEFAULT '{}',
    "methodologyNote" TEXT NOT NULL,
    "rev" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KpiSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManHoursInput" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "headcount" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "approverId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManHoursInput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlaEvent" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "clockStart" TIMESTAMP(3) NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "escalations" JSONB NOT NULL DEFAULT '[]',
    "resolvedAt" TIMESTAMP(3),
    "incidentId" TEXT,
    "capaId" TEXT,

    CONSTRAINT "SlaEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT,
    "role" TEXT,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "device" TEXT,
    "gpsLat" DOUBLE PRECISION,
    "gpsLng" DOUBLE PRECISION,
    "reason" TEXT,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConflictQueue" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "versions" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolver" TEXT,
    "dt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConflictQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EnumMaster_groupKey_status_idx" ON "EnumMaster"("groupKey", "status");

-- CreateIndex
CREATE UNIQUE INDEX "EnumMaster_groupKey_key_version_key" ON "EnumMaster"("groupKey", "key", "version");

-- CreateIndex
CREATE UNIQUE INDEX "RclConstant_key_key" ON "RclConstant"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Sequencer_entity_yearMonth_key" ON "Sequencer"("entity", "yearMonth");

-- CreateIndex
CREATE UNIQUE INDEX "Client_code_key" ON "Client"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Site_clientId_code_key" ON "Site"("clientId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Worker_nik_key" ON "Worker"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_unitCode_key" ON "Equipment"("unitCode");

-- CreateIndex
CREATE UNIQUE INDEX "UserAccount_workerId_key" ON "UserAccount"("workerId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAccount_email_key" ON "UserAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Incident_humanNo_key" ON "Incident"("humanNo");

-- CreateIndex
CREATE INDEX "Incident_clientId_siteId_status_idx" ON "Incident"("clientId", "siteId", "status");

-- CreateIndex
CREATE INDEX "Incident_incidentDt_idx" ON "Incident"("incidentDt");

-- CreateIndex
CREATE UNIQUE INDEX "Investigation_incidentId_key" ON "Investigation"("incidentId");

-- CreateIndex
CREATE UNIQUE INDEX "Capa_humanNo_key" ON "Capa"("humanNo");

-- CreateIndex
CREATE INDEX "Capa_status_dueD_idx" ON "Capa"("status", "dueD");

-- CreateIndex
CREATE UNIQUE INDEX "InspectionRecord_humanNo_key" ON "InspectionRecord"("humanNo");

-- CreateIndex
CREATE UNIQUE INDEX "ProactiveReport_humanNo_key" ON "ProactiveReport"("humanNo");

-- CreateIndex
CREATE INDEX "SlaEvent_status_deadline_idx" ON "SlaEvent"("status", "deadline");

-- CreateIndex
CREATE INDEX "AuditEvent_entity_entityId_idx" ON "AuditEvent"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditEvent_ts_idx" ON "AuditEvent"("ts");

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerDeployment" ADD CONSTRAINT "WorkerDeployment_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerDeployment" ADD CONSTRAINT "WorkerDeployment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerDeployment" ADD CONSTRAINT "WorkerDeployment_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentDeployment" ADD CONSTRAINT "EquipmentDeployment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentDeployment" ADD CONSTRAINT "EquipmentDeployment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentDeployment" ADD CONSTRAINT "EquipmentDeployment_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceEvent" ADD CONSTRAINT "MaintenanceEvent_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAccount" ADD CONSTRAINT "UserAccount_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentVictim" ADD CONSTRAINT "IncidentVictim_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentVictim" ADD CONSTRAINT "IncidentVictim_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentWitness" ADD CONSTRAINT "IncidentWitness_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentWitness" ADD CONSTRAINT "IncidentWitness_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentTimeline" ADD CONSTRAINT "IncidentTimeline_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentEvidence" ADD CONSTRAINT "IncidentEvidence_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentEquipment" ADD CONSTRAINT "IncidentEquipment_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentEquipment" ADD CONSTRAINT "IncidentEquipment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investigation" ADD CONSTRAINT "Investigation_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investigation" ADD CONSTRAINT "Investigation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "UserAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScatEntry" ADD CONSTRAINT "ScatEntry_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Amendment" ADD CONSTRAINT "Amendment_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Capa" ADD CONSTRAINT "Capa_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Capa" ADD CONSTRAINT "Capa_picId_fkey" FOREIGN KEY ("picId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Capa" ADD CONSTRAINT "Capa_verifierId_fkey" FOREIGN KEY ("verifierId") REFERENCES "UserAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionRecord" ADD CONSTRAINT "InspectionRecord_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "InspectionTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionRecord" ADD CONSTRAINT "InspectionRecord_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionRecord" ADD CONSTRAINT "InspectionRecord_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionRecord" ADD CONSTRAINT "InspectionRecord_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionRecord" ADD CONSTRAINT "InspectionRecord_performerId_fkey" FOREIGN KEY ("performerId") REFERENCES "UserAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionItem" ADD CONSTRAINT "InspectionItem_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "InspectionRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProactiveReport" ADD CONSTRAINT "ProactiveReport_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProactiveReport" ADD CONSTRAINT "ProactiveReport_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegReport" ADD CONSTRAINT "RegReport_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiSnapshot" ADD CONSTRAINT "KpiSnapshot_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManHoursInput" ADD CONSTRAINT "ManHoursInput_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManHoursInput" ADD CONSTRAINT "ManHoursInput_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlaEvent" ADD CONSTRAINT "SlaEvent_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlaEvent" ADD CONSTRAINT "SlaEvent_capaId_fkey" FOREIGN KEY ("capaId") REFERENCES "Capa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "UserAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

