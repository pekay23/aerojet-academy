-- Fix NULL timeExtensionSec values
UPDATE internal_exam_sessions SET "timeExtensionSec" = 0 WHERE "timeExtensionSec" IS NULL;
