/*
  # Données d'exemple pour les tests

  1. Clients de test
    - Création de quelques clients pour tester l'application
    - Avec des soldes différents et des statuts variés

  2. Transactions d'exemple
    - Quelques transactions pour montrer l'historique
    - Différents types et statuts de transactions

  3. Notes
    - Ces données sont optionnelles et peuvent être supprimées en production
    - Utiles pour tester les fonctionnalités de l'application
*/

-- Insertion de clients de test (optionnel)
INSERT INTO clients (id, email, full_name, phone, balance, status) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'client1@test.com', 'Jean Dupont', '+33123456789', 15000, 'active'),
  ('550e8400-e29b-41d4-a716-446655440002', 'client2@test.com', 'Marie Martin', '+33987654321', 8500, 'active'),
  ('550e8400-e29b-41d4-a716-446655440003', 'client3@test.com', 'Pierre Durand', '+33456789123', 0, 'suspended')
ON CONFLICT (id) DO NOTHING;

-- Insertion de transactions d'exemple (optionnel)
INSERT INTO transactions (client_id, type, amount, status, description, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'deposit', 10000, 'completed', 'Dépôt initial', now() - interval '5 days'),
  ('550e8400-e29b-41d4-a716-446655440001', 'deposit', 5000, 'completed', 'Dépôt supplémentaire', now() - interval '3 days'),
  ('550e8400-e29b-41d4-a716-446655440002', 'deposit', 8500, 'completed', 'Premier dépôt', now() - interval '2 days'),
  ('550e8400-e29b-41d4-a716-446655440001', 'withdrawal_request', 2000, 'pending', 'Demande de retrait de 2000 FCFA', now() - interval '1 hour')
ON CONFLICT (id) DO NOTHING;