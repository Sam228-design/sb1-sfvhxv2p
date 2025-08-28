/*
  # Création de la table des clients

  1. Nouvelles Tables
    - `clients`
      - `id` (uuid, clé primaire) - ID unique du client
      - `email` (text, unique) - Email du client pour la connexion
      - `full_name` (text) - Nom complet du client
      - `phone` (text) - Numéro de téléphone du client
      - `balance` (numeric) - Solde actuel du portefeuille
      - `status` (text) - Statut du compte (active/suspended)
      - `created_at` (timestamptz) - Date de création du compte
      - `updated_at` (timestamptz) - Date de dernière mise à jour

  2. Sécurité
    - Activation de RLS sur la table `clients`
    - Politique pour que les clients authentifiés puissent lire leurs propres données
    - Politique pour que l'admin puisse gérer tous les clients
*/

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  balance numeric DEFAULT 0 CHECK (balance >= 0),
  status text DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activation de la sécurité au niveau des lignes
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Politique pour que les clients puissent lire leurs propres données
CREATE POLICY "Clients can read own data"
  ON clients
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Politique pour que l'admin puisse tout gérer
CREATE POLICY "Admin can manage all clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'admin@wallet.com'
    )
  );

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_clients_updated_at 
  BEFORE UPDATE ON clients 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();