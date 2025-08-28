/*
  # Fonctions utilitaires pour l'application

  1. Fonctions
    - `get_client_balance` - Calculer le solde d'un client
    - `process_withdrawal` - Traiter une demande de retrait
    - `add_deposit` - Ajouter un dépôt à un client

  2. Sécurité
    - Toutes les fonctions vérifient les permissions
    - Seul l'admin peut exécuter les fonctions de gestion
*/

-- Fonction pour calculer le solde réel d'un client basé sur les transactions
CREATE OR REPLACE FUNCTION get_client_balance(client_uuid uuid)
RETURNS numeric AS $$
DECLARE
  total_deposits numeric := 0;
  total_withdrawals numeric := 0;
  current_balance numeric := 0;
BEGIN
  -- Calculer le total des dépôts approuvés
  SELECT COALESCE(SUM(amount), 0) INTO total_deposits
  FROM transactions 
  WHERE client_id = client_uuid 
    AND type = 'deposit' 
    AND status = 'completed';

  -- Calculer le total des retraits approuvés
  SELECT COALESCE(SUM(amount), 0) INTO total_withdrawals
  FROM transactions 
  WHERE client_id = client_uuid 
    AND type IN ('withdrawal', 'withdrawal_request') 
    AND status = 'approved';

  current_balance := total_deposits - total_withdrawals;
  
  RETURN GREATEST(current_balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour traiter une demande de retrait (admin seulement)
CREATE OR REPLACE FUNCTION process_withdrawal(
  transaction_uuid uuid,
  approve boolean,
  admin_email text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  transaction_record transactions%ROWTYPE;
  client_record clients%ROWTYPE;
  new_balance numeric;
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'admin@wallet.com'
  ) THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  -- Récupérer la transaction
  SELECT * INTO transaction_record
  FROM transactions 
  WHERE id = transaction_uuid 
    AND type = 'withdrawal_request' 
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction non trouvée ou déjà traitée';
  END IF;

  -- Récupérer le client
  SELECT * INTO client_record
  FROM clients 
  WHERE id = transaction_record.client_id;

  IF approve THEN
    -- Vérifier que le client a suffisamment de fonds
    IF client_record.balance < transaction_record.amount THEN
      RAISE EXCEPTION 'Solde insuffisant';
    END IF;

    -- Mettre à jour le solde du client
    new_balance := client_record.balance - transaction_record.amount;
    
    UPDATE clients 
    SET balance = new_balance, updated_at = now()
    WHERE id = client_record.id;

    -- Marquer la transaction comme approuvée
    UPDATE transactions 
    SET status = 'approved', 
        processed_at = now(),
        processed_by = COALESCE(admin_email, auth.email())
    WHERE id = transaction_uuid;
  ELSE
    -- Rejeter la transaction
    UPDATE transactions 
    SET status = 'rejected', 
        processed_at = now(),
        processed_by = COALESCE(admin_email, auth.email())
    WHERE id = transaction_uuid;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour ajouter un dépôt (admin seulement)
CREATE OR REPLACE FUNCTION add_deposit(
  client_uuid uuid,
  deposit_amount numeric,
  deposit_description text DEFAULT 'Dépôt'
)
RETURNS uuid AS $$
DECLARE
  transaction_id uuid;
  client_record clients%ROWTYPE;
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'admin@wallet.com'
  ) THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  -- Vérifier que le montant est positif
  IF deposit_amount <= 0 THEN
    RAISE EXCEPTION 'Le montant doit être positif';
  END IF;

  -- Récupérer le client
  SELECT * INTO client_record
  FROM clients 
  WHERE id = client_uuid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Client non trouvé';
  END IF;

  -- Créer la transaction de dépôt
  INSERT INTO transactions (client_id, type, amount, status, description)
  VALUES (client_uuid, 'deposit', deposit_amount, 'completed', deposit_description)
  RETURNING id INTO transaction_id;

  -- Mettre à jour le solde du client
  UPDATE clients 
  SET balance = balance + deposit_amount, updated_at = now()
  WHERE id = client_uuid;

  RETURN transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;