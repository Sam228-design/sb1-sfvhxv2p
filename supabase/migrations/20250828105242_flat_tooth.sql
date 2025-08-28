/*
  # Création de la table des transactions

  1. Nouvelles Tables
    - `transactions`
      - `id` (uuid, clé primaire) - ID unique de la transaction
      - `client_id` (uuid, foreign key) - Référence vers le client
      - `type` (text) - Type de transaction (deposit/withdrawal/withdrawal_request)
      - `amount` (numeric) - Montant de la transaction
      - `status` (text) - Statut de la transaction (pending/approved/rejected/completed)
      - `description` (text) - Description de la transaction
      - `created_at` (timestamptz) - Date de création de la transaction
      - `processed_at` (timestamptz) - Date de traitement par l'admin
      - `processed_by` (text) - Email de l'admin qui a traité la transaction

  2. Sécurité
    - Activation de RLS sur la table `transactions`
    - Politique pour que les clients puissent lire leurs propres transactions
    - Politique pour que les clients puissent créer des demandes de retrait
    - Politique pour que l'admin puisse gérer toutes les transactions

  3. Contraintes
    - Clé étrangère vers la table clients
    - Vérification des types et statuts valides
    - Montant positif obligatoire
*/

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'withdrawal_request')),
  amount numeric NOT NULL CHECK (amount > 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  description text NOT NULL,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  processed_by text
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_transactions_client_id ON transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- Activation de la sécurité au niveau des lignes
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Politique pour que les clients puissent lire leurs propres transactions
CREATE POLICY "Clients can read own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE auth.uid()::text = id::text
    )
  );

-- Politique pour que les clients puissent créer des demandes de retrait
CREATE POLICY "Clients can create withdrawal requests"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    type = 'withdrawal_request' 
    AND status = 'pending'
    AND client_id IN (
      SELECT id FROM clients WHERE auth.uid()::text = id::text
    )
  );

-- Politique pour que l'admin puisse gérer toutes les transactions
CREATE POLICY "Admin can manage all transactions"
  ON transactions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@wallet.com'
    )
  );