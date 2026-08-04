-- ============================================
-- PRISMA Setup - Jalankan di Supabase SQL Editor
-- Password: 123
-- ============================================

-- STEP 1: Buat tables (migration)
CREATE TYPE "Role" AS ENUM ('PEKERJA', 'PENGAWAS', 'HSE', 'PJO', 'MGMT', 'SO', 'AUD');
CREATE TYPE "IncidentStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'INVESTIGATING', 'REPORT_DRAFT', 'HSE_REVIEW', 'FINAL', 'REPORTED', 'CLOSED', 'VOID');
CREATE TYPE "InvestigationStatus" AS ENUM ('OPEN', 'REPORT_DRAFT', 'HSE_REVIEW', 'FINAL');
CREATE TYPE "CapaStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'AWAITING_VERIFICATION', 'CLOSED', 'REOPENED');
CREATE TYPE "InspectionStatus" AS ENUM ('SCHEDULED', 'DONE', 'FOLLOW_UP', 'CLOSED');
CREATE TYPE "ProactiveStatus" AS ENUM ('NEW', 'ACKNOWLEDGED', 'ACTIONED', 'CLOSED');

CREATE TABLE "EnumMaster" ("id" TEXT NOT NULL,"groupKey" TEXT NOT NULL,"key" TEXT NOT NULL,"labelId" TEXT NOT NULL,"labelEn" TEXT,"parentKey" TEXT,"version" INTEGER NOT NULL DEFAULT 1,"regulatory" BOOLEAN NOT NULL DEFAULT false,"sourceCitation" TEXT,"activeFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"activeTo" TIMESTAMP(3),"status" TEXT NOT NULL DEFAULT 'ACTIVE',"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "EnumMaster_pkey" PRIMARY KEY ("id"));
CREATE TABLE "RclConstant" ("id" TEXT NOT NULL,"key" TEXT NOT NULL,"label" TEXT NOT NULL,"value" TEXT NOT NULL,"citation" TEXT NOT NULL,"urlJdih" TEXT,"sha256Doc" TEXT,"tglVerifikasi" TIMESTAMP(3),"verifier" TEXT,"status" TEXT NOT NULL DEFAULT 'PENDING_TRANSCRIPTION',"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "RclConstant_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Sequencer" ("id" TEXT NOT NULL,"entity" TEXT NOT NULL,"yearMonth" TEXT NOT NULL,"lastValue" INTEGER NOT NULL DEFAULT 0,CONSTRAINT "Sequencer_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Client" ("id" TEXT NOT NULL,"code" TEXT NOT NULL,"name" TEXT NOT NULL,"iupNo" TEXT,"kttName" TEXT,"reportTemplateRef" TEXT,"active" BOOLEAN NOT NULL DEFAULT true,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "Client_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Site" ("id" TEXT NOT NULL,"clientId" TEXT NOT NULL,"code" TEXT NOT NULL,"name" TEXT NOT NULL,"tz" TEXT NOT NULL DEFAULT 'Asia/Jakarta',"shifts" JSONB NOT NULL DEFAULT '[{"code":"DAY","label":"Day","start":"07:00","end":"15:00"},{"code":"SWING","label":"Swing","start":"15:00","end":"23:00"},{"code":"NIGHT","label":"Night","start":"23:00","end":"07:00"}]',"active" BOOLEAN NOT NULL DEFAULT true,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "Site_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Location" ("id" TEXT NOT NULL,"siteId" TEXT NOT NULL,"name" TEXT NOT NULL,"areaType" TEXT NOT NULL,"active" BOOLEAN NOT NULL DEFAULT true,CONSTRAINT "Location_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Worker" ("id" TEXT NOT NULL,"nik" TEXT NOT NULL,"name" TEXT NOT NULL,"dept" TEXT,"position" TEXT,"empStatus" TEXT NOT NULL,"hireDate" TIMESTAMP(3),"dob" TIMESTAMP(3),"active" BOOLEAN NOT NULL DEFAULT true,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "Worker_pkey" PRIMARY KEY ("id"));
CREATE TABLE "WorkerDeployment" ("id" TEXT NOT NULL,"workerId" TEXT NOT NULL,"clientId" TEXT NOT NULL,"siteId" TEXT NOT NULL,"startD" TIMESTAMP(3) NOT NULL,"endD" TIMESTAMP(3),"roleAtSite" TEXT,"status" TEXT NOT NULL DEFAULT 'ACTIVE',CONSTRAINT "WorkerDeployment_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Certification" ("id" TEXT NOT NULL,"workerId" TEXT NOT NULL,"type" TEXT NOT NULL,"no" TEXT,"issuer" TEXT,"expiryD" TIMESTAMP(3),"file" TEXT,CONSTRAINT "Certification_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Equipment" ("id" TEXT NOT NULL,"unitCode" TEXT NOT NULL,"type" TEXT NOT NULL,"make" TEXT,"model" TEXT,"year" INTEGER,"status" TEXT NOT NULL DEFAULT 'AKTIF',CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id"));
CREATE TABLE "EquipmentDeployment" ("id" TEXT NOT NULL,"equipmentId" TEXT NOT NULL,"clientId" TEXT NOT NULL,"siteId" TEXT NOT NULL,"startD" TIMESTAMP(3) NOT NULL,"endD" TIMESTAMP(3),"status" TEXT NOT NULL DEFAULT 'ACTIVE',CONSTRAINT "EquipmentDeployment_pkey" PRIMARY KEY ("id"));
CREATE TABLE "MaintenanceEvent" ("id" TEXT NOT NULL,"equipmentId" TEXT NOT NULL,"dt" TIMESTAMP(3) NOT NULL,"type" TEXT NOT NULL,"desc" TEXT,"source" TEXT NOT NULL DEFAULT 'MANUAL',"woRef" TEXT,CONSTRAINT "MaintenanceEvent_pkey" PRIMARY KEY ("id"));
CREATE TABLE "UserAccount" ("id" TEXT NOT NULL,"workerId" TEXT NOT NULL,"email" TEXT NOT NULL,"passwordHash" TEXT NOT NULL,"role" "Role" NOT NULL,"active" BOOLEAN NOT NULL DEFAULT true,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "UserAccount_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Incident" ("id" TEXT NOT NULL,"humanNo" TEXT NOT NULL,"clientId" TEXT NOT NULL,"siteId" TEXT NOT NULL,"locationId" TEXT,"title" TEXT NOT NULL,"incidentDt" TIMESTAMP(3) NOT NULL,"shift" TEXT NOT NULL,"workDayNo" INTEGER,"workdayRefWorkerId" TEXT,"weather" TEXT,"regType" TEXT NOT NULL,"kbSpecCode" TEXT,"mgmtCategory" TEXT NOT NULL,"indClass" TEXT NOT NULL,"regClass" TEXT NOT NULL,"potentialSev" INTEGER NOT NULL,"hipo" BOOLEAN NOT NULL DEFAULT false,"description" TEXT NOT NULL,"preservation" JSONB NOT NULL DEFAULT '{}',"supervisorId" TEXT,"picId" TEXT,"statsIncluded" BOOLEAN NOT NULL DEFAULT true,"duplicateOf" TEXT,"amendmentRef" TEXT,"voidReason" TEXT,"status" "IncidentStatus" NOT NULL DEFAULT 'DRAFT',"createdBy" TEXT NOT NULL,"deviceTs" TIMESTAMP(3),"gpsLat" DOUBLE PRECISION,"gpsLng" DOUBLE PRECISION,"gpsAccuracy" DOUBLE PRECISION,"version" INTEGER NOT NULL DEFAULT 1,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "Incident_pkey" PRIMARY KEY ("id"));
CREATE TABLE "IncidentVictim" ("id" TEXT NOT NULL,"incidentId" TEXT NOT NULL,"workerId" TEXT NOT NULL,"expY" INTEGER NOT NULL DEFAULT 0,"expM" INTEGER NOT NULL DEFAULT 0,"bodyPart" TEXT,"injuryType" TEXT,"outcome" TEXT,"lostDays" INTEGER NOT NULL DEFAULT 0,"ongoing" BOOLEAN NOT NULL DEFAULT false,"facility" TEXT,"restricted" BOOLEAN NOT NULL DEFAULT false,CONSTRAINT "IncidentVictim_pkey" PRIMARY KEY ("id"));
CREATE TABLE "IncidentWitness" ("id" TEXT NOT NULL,"incidentId" TEXT NOT NULL,"workerId" TEXT NOT NULL,"kind" TEXT NOT NULL,"statement" TEXT,"file" TEXT,CONSTRAINT "IncidentWitness_pkey" PRIMARY KEY ("id"));
CREATE TABLE "IncidentTimeline" ("id" TEXT NOT NULL,"incidentId" TEXT NOT NULL,"ts" TIMESTAMP(3) NOT NULL,"event" TEXT NOT NULL,CONSTRAINT "IncidentTimeline_pkey" PRIMARY KEY ("id"));
CREATE TABLE "IncidentEvidence" ("id" TEXT NOT NULL,"incidentId" TEXT NOT NULL,"kind" TEXT NOT NULL,"file" TEXT NOT NULL,"sha256" TEXT,"gpsLat" DOUBLE PRECISION,"gpsLng" DOUBLE PRECISION,"ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "IncidentEvidence_pkey" PRIMARY KEY ("id"));
CREATE TABLE "IncidentEquipment" ("id" TEXT NOT NULL,"incidentId" TEXT NOT NULL,"equipmentId" TEXT NOT NULL,CONSTRAINT "IncidentEquipment_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Investigation" ("id" TEXT NOT NULL,"incidentId" TEXT NOT NULL,"method" TEXT NOT NULL DEFAULT 'SCAT',"startDt" TIMESTAMP(3) NOT NULL,"leadId" TEXT NOT NULL,"members" JSONB NOT NULL DEFAULT '[]',"rootCause" TEXT,"findings" TEXT,"qualityReview" JSONB NOT NULL DEFAULT '{}',"status" "InvestigationStatus" NOT NULL DEFAULT 'OPEN',"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "Investigation_pkey" PRIMARY KEY ("id"));
CREATE TABLE "ScatEntry" ("id" TEXT NOT NULL,"investigationId" TEXT NOT NULL,"phase" TEXT NOT NULL,"code" TEXT NOT NULL,"label" TEXT NOT NULL,"note" TEXT NOT NULL,CONSTRAINT "ScatEntry_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Amendment" ("id" TEXT NOT NULL,"targetEntity" TEXT NOT NULL,"targetId" TEXT NOT NULL,"rev" INTEGER NOT NULL,"delta" JSONB NOT NULL,"reason" TEXT NOT NULL,"requester" TEXT NOT NULL,"approver" TEXT,"dt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"incidentId" TEXT,CONSTRAINT "Amendment_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Capa" ("id" TEXT NOT NULL,"humanNo" TEXT NOT NULL,"source" TEXT NOT NULL,"sourceRef" TEXT,"incidentId" TEXT,"action" TEXT NOT NULL,"controlType" TEXT NOT NULL,"priority" TEXT NOT NULL,"picId" TEXT NOT NULL,"dueD" TIMESTAMP(3) NOT NULL,"status" "CapaStatus" NOT NULL DEFAULT 'OPEN',"progress" INTEGER NOT NULL DEFAULT 0,"evidence" JSONB NOT NULL DEFAULT '[]',"verifierId" TEXT,"verifyDt" TIMESTAMP(3),"verifyResult" TEXT,"reopenCount" INTEGER NOT NULL DEFAULT 0,"recurrenceFlag" BOOLEAN NOT NULL DEFAULT false,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "Capa_pkey" PRIMARY KEY ("id"));
CREATE TABLE "InspectionTemplate" ("id" TEXT NOT NULL,"scope" TEXT NOT NULL,"name" TEXT NOT NULL,"version" INTEGER NOT NULL DEFAULT 1,"items" JSONB NOT NULL,"active" BOOLEAN NOT NULL DEFAULT true,CONSTRAINT "InspectionTemplate_pkey" PRIMARY KEY ("id"));
CREATE TABLE "InspectionRecord" ("id" TEXT NOT NULL,"humanNo" TEXT NOT NULL,"templateId" TEXT NOT NULL,"equipmentId" TEXT,"siteId" TEXT NOT NULL,"locationId" TEXT,"performerId" TEXT NOT NULL,"dt" TIMESTAMP(3) NOT NULL,"status" "InspectionStatus" NOT NULL DEFAULT 'SCHEDULED',"followupRef" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "InspectionRecord_pkey" PRIMARY KEY ("id"));
CREATE TABLE "InspectionItem" ("id" TEXT NOT NULL,"recordId" TEXT NOT NULL,"itemCode" TEXT NOT NULL,"result" TEXT NOT NULL,"note" TEXT,"photo" TEXT,"sev" INTEGER,CONSTRAINT "InspectionItem_pkey" PRIMARY KEY ("id"));
CREATE TABLE "ProactiveReport" ("id" TEXT NOT NULL,"humanNo" TEXT NOT NULL,"reporterId" TEXT,"anonymous" BOOLEAN NOT NULL DEFAULT false,"sealedContact" TEXT,"siteId" TEXT NOT NULL,"locationId" TEXT,"category" TEXT NOT NULL,"desc" TEXT NOT NULL,"photo" TEXT,"suggestion" TEXT,"status" "ProactiveStatus" NOT NULL DEFAULT 'NEW',"responseDt" TIMESTAMP(3),"slaFlag" BOOLEAN NOT NULL DEFAULT false,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "ProactiveReport_pkey" PRIMARY KEY ("id"));
CREATE TABLE "RegReport" ("id" TEXT NOT NULL,"kind" TEXT NOT NULL,"clientId" TEXT,"period" TEXT NOT NULL,"snapshot" JSONB NOT NULL,"file" TEXT,"status" TEXT NOT NULL DEFAULT 'DRAFT',"sentDt" TIMESTAMP(3),"channel" TEXT,"recipient" TEXT,"receiptRef" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "RegReport_pkey" PRIMARY KEY ("id"));
CREATE TABLE "KpiSnapshot" ("id" TEXT NOT NULL,"scope" TEXT NOT NULL,"siteId" TEXT,"period" TEXT NOT NULL,"manHours" DOUBLE PRECISION NOT NULL DEFAULT 0,"fr" DOUBLE PRECISION NOT NULL DEFAULT 0,"sr" DOUBLE PRECISION NOT NULL DEFAULT 0,"leading" JSONB NOT NULL DEFAULT '{}',"methodologyNote" TEXT NOT NULL,"rev" INTEGER NOT NULL DEFAULT 1,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "KpiSnapshot_pkey" PRIMARY KEY ("id"));
CREATE TABLE "ManHoursInput" ("id" TEXT NOT NULL,"siteId" TEXT NOT NULL,"clientId" TEXT NOT NULL,"period" TEXT NOT NULL,"hours" DOUBLE PRECISION NOT NULL,"headcount" INTEGER NOT NULL,"source" TEXT NOT NULL DEFAULT 'MANUAL',"approverId" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "ManHoursInput_pkey" PRIMARY KEY ("id"));
CREATE TABLE "SlaEvent" ("id" TEXT NOT NULL,"entityType" TEXT NOT NULL,"entityId" TEXT NOT NULL,"kind" TEXT NOT NULL,"clockStart" TIMESTAMP(3) NOT NULL,"deadline" TIMESTAMP(3) NOT NULL,"status" TEXT NOT NULL DEFAULT 'OPEN',"escalations" JSONB NOT NULL DEFAULT '[]',"resolvedAt" TIMESTAMP(3),"incidentId" TEXT,"capaId" TEXT,CONSTRAINT "SlaEvent_pkey" PRIMARY KEY ("id"));
CREATE TABLE "NotificationLog" ("id" TEXT NOT NULL,"code" TEXT NOT NULL,"channel" TEXT NOT NULL,"recipient" TEXT NOT NULL,"subject" TEXT NOT NULL,"body" TEXT NOT NULL,"entityType" TEXT,"entityId" TEXT,"sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"read" BOOLEAN NOT NULL DEFAULT false,CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id"));
CREATE TABLE "AuditEvent" ("id" TEXT NOT NULL,"ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"actorId" TEXT,"role" TEXT,"entity" TEXT NOT NULL,"entityId" TEXT NOT NULL,"action" TEXT NOT NULL,"before" JSONB,"after" JSONB,"device" TEXT,"gpsLat" DOUBLE PRECISION,"gpsLng" DOUBLE PRECISION,"reason" TEXT,CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id"));
CREATE TABLE "ConflictQueue" ("id" TEXT NOT NULL,"entityType" TEXT NOT NULL,"entityId" TEXT NOT NULL,"versions" JSONB NOT NULL,"status" TEXT NOT NULL DEFAULT 'OPEN',"resolver" TEXT,"dt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "ConflictQueue_pkey" PRIMARY KEY ("id"));

-- Indexes
CREATE INDEX "EnumMaster_groupKey_status_idx" ON "EnumMaster"("groupKey", "status");
CREATE UNIQUE INDEX "EnumMaster_groupKey_key_version_key" ON "EnumMaster"("groupKey", "key", "version");
CREATE UNIQUE INDEX "RclConstant_key_key" ON "RclConstant"("key");
CREATE UNIQUE INDEX "Sequencer_entity_yearMonth_key" ON "Sequencer"("entity", "yearMonth");
CREATE UNIQUE INDEX "Client_code_key" ON "Client"("code");
CREATE UNIQUE INDEX "Site_clientId_code_key" ON "Site"("clientId", "code");
CREATE UNIQUE INDEX "Worker_nik_key" ON "Worker"("nik");
CREATE UNIQUE INDEX "Equipment_unitCode_key" ON "Equipment"("unitCode");
CREATE UNIQUE INDEX "UserAccount_workerId_key" ON "UserAccount"("workerId");
CREATE UNIQUE INDEX "UserAccount_email_key" ON "UserAccount"("email");
CREATE UNIQUE INDEX "Incident_humanNo_key" ON "Incident"("humanNo");
CREATE INDEX "Incident_clientId_siteId_status_idx" ON "Incident"("clientId", "siteId", "status");
CREATE INDEX "Incident_incidentDt_idx" ON "Incident"("incidentDt");
CREATE UNIQUE INDEX "Investigation_incidentId_key" ON "Investigation"("incidentId");
CREATE UNIQUE INDEX "Capa_humanNo_key" ON "Capa"("humanNo");
CREATE INDEX "Capa_status_dueD_idx" ON "Capa"("status", "dueD");
CREATE UNIQUE INDEX "InspectionRecord_humanNo_key" ON "InspectionRecord"("humanNo");
CREATE UNIQUE INDEX "ProactiveReport_humanNo_key" ON "ProactiveReport"("humanNo");
CREATE INDEX "SlaEvent_status_deadline_idx" ON "SlaEvent"("status", "deadline");
CREATE INDEX "AuditEvent_entity_entityId_idx" ON "AuditEvent"("entity", "entityId");
CREATE INDEX "AuditEvent_ts_idx" ON "AuditEvent"("ts");

-- Foreign Keys
ALTER TABLE "Site" ADD CONSTRAINT "Site_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Location" ADD CONSTRAINT "Location_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkerDeployment" ADD CONSTRAINT "WorkerDeployment_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkerDeployment" ADD CONSTRAINT "WorkerDeployment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkerDeployment" ADD CONSTRAINT "WorkerDeployment_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EquipmentDeployment" ADD CONSTRAINT "EquipmentDeployment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EquipmentDeployment" ADD CONSTRAINT "EquipmentDeployment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EquipmentDeployment" ADD CONSTRAINT "EquipmentDeployment_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MaintenanceEvent" ADD CONSTRAINT "MaintenanceEvent_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserAccount" ADD CONSTRAINT "UserAccount_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IncidentVictim" ADD CONSTRAINT "IncidentVictim_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IncidentVictim" ADD CONSTRAINT "IncidentVictim_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IncidentWitness" ADD CONSTRAINT "IncidentWitness_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IncidentWitness" ADD CONSTRAINT "IncidentWitness_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IncidentTimeline" ADD CONSTRAINT "IncidentTimeline_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IncidentEvidence" ADD CONSTRAINT "IncidentEvidence_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IncidentEquipment" ADD CONSTRAINT "IncidentEquipment_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IncidentEquipment" ADD CONSTRAINT "IncidentEquipment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Investigation" ADD CONSTRAINT "Investigation_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Investigation" ADD CONSTRAINT "Investigation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "UserAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ScatEntry" ADD CONSTRAINT "ScatEntry_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Amendment" ADD CONSTRAINT "Amendment_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Capa" ADD CONSTRAINT "Capa_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Capa" ADD CONSTRAINT "Capa_picId_fkey" FOREIGN KEY ("picId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Capa" ADD CONSTRAINT "Capa_verifierId_fkey" FOREIGN KEY ("verifierId") REFERENCES "UserAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InspectionRecord" ADD CONSTRAINT "InspectionRecord_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "InspectionTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InspectionRecord" ADD CONSTRAINT "InspectionRecord_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InspectionRecord" ADD CONSTRAINT "InspectionRecord_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InspectionRecord" ADD CONSTRAINT "InspectionRecord_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InspectionRecord" ADD CONSTRAINT "InspectionRecord_performerId_fkey" FOREIGN KEY ("performerId") REFERENCES "UserAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InspectionItem" ADD CONSTRAINT "InspectionItem_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "InspectionRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProactiveReport" ADD CONSTRAINT "ProactiveReport_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProactiveReport" ADD CONSTRAINT "ProactiveReport_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RegReport" ADD CONSTRAINT "RegReport_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "KpiSnapshot" ADD CONSTRAINT "KpiSnapshot_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ManHoursInput" ADD CONSTRAINT "ManHoursInput_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ManHoursInput" ADD CONSTRAINT "ManHoursInput_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SlaEvent" ADD CONSTRAINT "SlaEvent_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SlaEvent" ADD CONSTRAINT "SlaEvent_capaId_fkey" FOREIGN KEY ("capaId") REFERENCES "Capa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "UserAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================
-- STEP 2: Seed data
-- ============================================

-- EnumMaster seeds
INSERT INTO "EnumMaster" ("id","groupKey","key","labelId","version","regulatory","status","createdAt","updatedAt") VALUES
('e001','mgmt_category','INJ','Cedera',1,false,'ACTIVE',NOW(),NOW()),
('e002','mgmt_category','PD','Kerusakan properti',1,false,'ACTIVE',NOW(),NOW()),
('e003','mgmt_category','ENV','Lingkungan',1,false,'ACTIVE',NOW(),NOW()),
('e004','mgmt_category','PB','Proses bisnis',1,false,'ACTIVE',NOW(),NOW()),
('e005','mgmt_category','MECH','Mekanikal',1,false,'ACTIVE',NOW(),NOW()),
('e006','ind_class','NM','Near Miss',1,true,'ACTIVE',NOW(),NOW()),
('e007','ind_class','FAI','First Aid Injury',1,true,'ACTIVE',NOW(),NOW()),
('e008','ind_class','MTI','Medical Treatment Injury',1,true,'ACTIVE',NOW(),NOW()),
('e009','ind_class','RWTC','Restricted Work Case',1,true,'ACTIVE',NOW(),NOW()),
('e010','ind_class','LTI','Lost Time Injury',1,true,'ACTIVE',NOW(),NOW()),
('e011','ind_class','FAT','Fatality',1,true,'ACTIVE',NOW(),NOW()),
('e012','reg_type','KT','Kecelakaan Tambang',1,true,'ACTIVE',NOW(),NOW()),
('e013','reg_type','KB','Kejadian Berbahaya',1,true,'ACTIVE',NOW(),NOW()),
('e014','reg_type','PAK','Penyakit Akibat Kerja',1,true,'ACTIVE',NOW(),NOW()),
('e015','reg_type','NA','Bukan kecelakaan tambang',1,true,'ACTIVE',NOW(),NOW()),
('e016','reg_class','RINGAN','Ringan',1,true,'ACTIVE',NOW(),NOW()),
('e017','reg_class','BERAT','Berat',1,true,'ACTIVE',NOW(),NOW()),
('e018','reg_class','MENINGGAL','Meninggal',1,true,'ACTIVE',NOW(),NOW()),
('e019','reg_class','NA','Tidak berlaku',1,true,'ACTIVE',NOW(),NOW()),
('e020','area_type','WORKSHOP','Workshop',1,false,'ACTIVE',NOW(),NOW()),
('e021','area_type','HAULROAD','Jalan angkut',1,false,'ACTIVE',NOW(),NOW()),
('e022','area_type','PARKIR','Parkir',1,false,'ACTIVE',NOW(),NOW()),
('e023','area_type','FRONT','Front tambang',1,false,'ACTIVE',NOW(),NOW()),
('e024','area_type','PLANT','Plant',1,false,'ACTIVE',NOW(),NOW()),
('e025','area_type','GUDANG','Gudang',1,false,'ACTIVE',NOW(),NOW()),
('e026','area_type','OFFICE','Kantor',1,false,'ACTIVE',NOW(),NOW()),
('e027','area_type','LAIN','Lain-lain',1,false,'ACTIVE',NOW(),NOW()),
('e028','emp_status','TETAP','Tetap',1,false,'ACTIVE',NOW(),NOW()),
('e029','emp_status','KONTRAK','Kontrak',1,false,'ACTIVE',NOW(),NOW()),
('e030','emp_status','HARIAN','Harian',1,false,'ACTIVE',NOW(),NOW()),
('e031','emp_status','MAGANG','Magang',1,false,'ACTIVE',NOW(),NOW()),
('e032','control_type','ELIM','Eliminasi',1,false,'ACTIVE',NOW(),NOW()),
('e033','control_type','SUB','Substitusi',1,false,'ACTIVE',NOW(),NOW()),
('e034','control_type','ENG','Rekayasa',1,false,'ACTIVE',NOW(),NOW()),
('e035','control_type','ADM','Administratif',1,false,'ACTIVE',NOW(),NOW()),
('e036','control_type','APD','Alat Pelindung Diri',1,false,'ACTIVE',NOW(),NOW()),
('e037','priority','P1','Prioritas 1 (7 hari)',1,false,'ACTIVE',NOW(),NOW()),
('e038','priority','P2','Prioritas 2 (30 hari)',1,false,'ACTIVE',NOW(),NOW()),
('e039','priority','P3','Prioritas 3 (90 hari)',1,false,'ACTIVE',NOW(),NOW());

-- RCL seeds
INSERT INTO "RclConstant" ("id","key","label","value","citation","status","createdAt","updatedAt") VALUES
('r001','INVESTIGATION_DEADLINE_HOURS','Tenggat penyelidikan kecelakaan/kejadian berbahaya','48','Lampiran Kepmen ESDM 1827 K/30/MEM/2018','VERIFIED',NOW(),NOW()),
('r002','DISNAKER_REPORT_DEADLINE_HOURS','Tenggat lapor kecelakaan ke Disnaker setempat','48','Permenaker 03/MEN/1998','VERIFIED',NOW(),NOW()),
('r003','ESCALATE_BEFORE_HOURS','Eskalasi sebelum tenggat','6','Konfigurasi internal','VERIFIED',NOW(),NOW()),
('r004','HAZARD_RESPONSE_HOURS','Respons bahaya (hazard)','24','Konfigurasi internal','VERIFIED',NOW(),NOW()),
('r005','CAPA_DUE_P1_DAYS','Tenggat CAPA Prioritas 1','7','Konfigurasi internal','VERIFIED',NOW(),NOW()),
('r006','CAPA_DUE_P2_DAYS','Tenggat CAPA Prioritas 2','30','Konfigurasi internal','VERIFIED',NOW(),NOW()),
('r007','CAPA_DUE_P3_DAYS','Tenggat CAPA Prioritas 3','90','Konfigurasi internal','VERIFIED',NOW(),NOW()),
('r008','MANHOURS_VARIANCE_PCT','Ambang varians jam kerja','20','Konfigurasi internal','VERIFIED',NOW(),NOW()),
('r009','HIPO_SEVERITY_THRESHOLD','Ambang keparahan HIPO','4','Konfigurasi internal','VERIFIED',NOW(),NOW());

-- Demo client + site
INSERT INTO "Client" ("id","code","name","iupNo","kttName","createdAt","updatedAt") VALUES
('c001','CLT-001','PT Tambang Nusantara Jaya','IUP-0001-2020','Ir. Bambang Wijaya',NOW(),NOW()),
('c002','CLT-002','PT Sifang Mining Indonesia',NULL,'Zia Ulfadlah Idris',NOW(),NOW());

INSERT INTO "Site" ("id","clientId","code","name","createdAt","updatedAt") VALUES
('s001','c001','SITE-A','Site Alpha',NOW(),NOW()),
('s002','c002','SITE-B','Site Beta',NOW(),NOW());

INSERT INTO "Location" ("id","siteId","name","areaType","active") VALUES
('l001','s001','Front Pit Alpha 1','FRONT',true),
('l002','s001','Workshop Utama','WORKSHOP',true),
('l003','s002','Front Pit Beta','FRONT',true),
('l004','s002','Workshop Beta','WORKSHOP',true);

-- Equipment
INSERT INTO "Equipment" ("id","unitCode","type","make","model","status") VALUES
('eq001','EX-001','Excavator','Komatsu','PC2000','AKTIF');

-- Inspection template
INSERT INTO "InspectionTemplate" ("id","scope","name","version","items","active") VALUES
('it001','EQUIPMENT','P2H Alat Berat Harian',1,'[{"code":"P2H-01","question":"Kondisi ban/track layak jalan?","critical":true},{"code":"P2H-02","question":"Level oli hidrolik normal?","critical":true},{"code":"P2H-03","question":"Sistem rem berfungsi baik?","critical":true},{"code":"P2H-04","question":"Lampu & klakson berfungsi?","critical":false},{"code":"P2H-05","question":"APAR tersedia & belum expired?","critical":true}]',true);

-- ============================================
-- STEP 3: Buat akun login (password: 123)
-- ============================================

INSERT INTO "Worker" ("id","nik","name","empStatus","active","createdAt","updatedAt") VALUES
('w001','0000000010','Jules Indigo','TETAP',true,NOW(),NOW()),
('w002','0000000001','Priastama Adiyoga','TETAP',true,NOW(),NOW()),
('w003','0000000002','Siti Rahma (HSE Officer)','TETAP',true,NOW(),NOW()),
('w004','0000000003','Ir. Bambang Wijaya (PJO)','TETAP',true,NOW(),NOW()),
('w005','0000000004','Andi Kurniawan (Pengawas)','TETAP',true,NOW(),NOW()),
('w006','0000000005','Joko Santoso (Pekerja)','TETAP',true,NOW(),NOW()),
('w007','0000000006','Dewi Lestari (Manajemen)','TETAP',true,NOW(),NOW()),
('w008','0000000007','Rudi Hartono (Auditor)','TETAP',true,NOW(),NOW());

INSERT INTO "WorkerDeployment" ("id","workerId","clientId","siteId","startD","status","roleAtSite") VALUES
('wd001','w001','c001','s001',NOW(),'ACTIVE','SO'),
('wd002','w002','c001','s001',NOW(),'ACTIVE','SO'),
('wd003','w003','c001','s001',NOW(),'ACTIVE','HSE'),
('wd004','w004','c001','s001',NOW(),'ACTIVE','PJO'),
('wd005','w005','c001','s001',NOW(),'ACTIVE','PENGAWAS'),
('wd006','w006','c001','s001',NOW(),'ACTIVE','PEKERJA'),
('wd007','w007','c001','s001',NOW(),'ACTIVE','MGMT'),
('wd008','w008','c001','s001',NOW(),'ACTIVE','AUD');

-- Password hash bcrypt untuk "123"
INSERT INTO "UserAccount" ("id","workerId","email","passwordHash","role","active","createdAt","updatedAt") VALUES
('ua001','w001','jules.indigosocial@gmail.com','$2a$10$/f1mzFnjEBGmclaN6lg4ne2k9uNfvtSUmXnISVbQc0oTa/ol5w0DW','SO',true,NOW(),NOW()),
('ua002','w002','so@prisma.local','$2a$10$/f1mzFnjEBGmclaN6lg4ne2k9uNfvtSUmXnISVbQc0oTa/ol5w0DW','SO',true,NOW(),NOW()),
('ua003','w003','hse@prisma.local','$2a$10$/f1mzFnjEBGmclaN6lg4ne2k9uNfvtSUmXnISVbQc0oTa/ol5w0DW','HSE',true,NOW(),NOW()),
('ua004','w004','pjo@prisma.local','$2a$10$/f1mzFnjEBGmclaN6lg4ne2k9uNfvtSUmXnISVbQc0oTa/ol5w0DW','PJO',true,NOW(),NOW()),
('ua005','w005','pengawas@prisma.local','$2a$10$/f1mzFnjEBGmclaN6lg4ne2k9uNfvtSUmXnISVbQc0oTa/ol5w0DW','PENGAWAS',true,NOW(),NOW()),
('ua006','w006','pekerja@prisma.local','$2a$10$/f1mzFnjEBGmclaN6lg4ne2k9uNfvtSUmXnISVbQc0oTa/ol5w0DW','PEKERJA',true,NOW(),NOW()),
('ua007','w007','mgmt@prisma.local','$2a$10$/f1mzFnjEBGmclaN6lg4ne2k9uNfvtSUmXnISVbQc0oTa/ol5w0DW','MGMT',true,NOW(),NOW()),
('ua008','w008','audit@prisma.local','$2a$10$/f1mzFnjEBGmclaN6lg4ne2k9uNfvtSUmXnISVbQc0oTa/ol5w0DW','AUD',true,NOW(),NOW());
