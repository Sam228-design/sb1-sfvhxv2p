/*
  # Création du compte administrateur

  1. Compte Admin
    - Email: admin@wallet.com
    - Mot de passe: admin123
    - Confirmation automatique de l'email

  2. Notes importantes
    - Ce script doit être exécuté après la création des tables
    - Le mot de passe peut être changé après la première connexion
    - L'admin n'apparaît pas dans la table clients car il utilise directement auth.users
*/

-- Insertion du compte admin dans auth.users
-- Note: Cette insertion se fait via l'interface Supabase ou via l'API admin
-- Voici les données à utiliser pour créer le compte admin:

/*
Email: admin@wallet.com
Password: admin123
Email Confirm: true
*/

-- Vous pouvez créer ce compte via l'interface Supabase Auth ou en utilisant le code suivant dans votre application:

/*
const { data, error } = await supabase.auth.admin.createUser({
  email: 'admin@wallet.com',
  password: 'admin123',
  email_confirm: true
})
*/