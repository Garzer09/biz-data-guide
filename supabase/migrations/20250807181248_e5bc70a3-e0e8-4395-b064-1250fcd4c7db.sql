-- Agregar constraint única para permitir upserts en debt_service
ALTER TABLE debt_service 
ADD CONSTRAINT debt_service_company_periodo_unique 
UNIQUE (company_id, periodo);