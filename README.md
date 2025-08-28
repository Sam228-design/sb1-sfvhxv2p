# Système de Portefeuille Numérique

Une application de gestion de portefeuille numérique avec interface administrateur pour la gestion manuelle des transactions physiques.

## Fonctionnalités

### Pour l'Administrateur
- Création de comptes clients
- Ajout de fonds aux portefeuilles clients (après réception d'argent physique)
- Traitement des demandes de retrait
- Vue d'ensemble de tous les clients et transactions
- Gestion du statut des comptes

### Pour les Clients
- Consultation du solde
- Demande de retrait
- Historique des transactions
- Interface mobile-friendly

## Configuration

1. Créez un projet Supabase
2. Copiez `.env.example` vers `.env`
3. Configurez vos variables d'environnement Supabase
4. Créez les tables nécessaires (voir schema.sql)
5. Créez un compte admin avec l'email `admin@wallet.com`

## Installation

```bash
npm install
npm run dev
```

## Comptes de test

- **Admin**: admin@wallet.com / admin123
- **Clients**: Les comptes sont créés par l'administrateur

## Architecture

- **Frontend**: React + TypeScript + Tailwind CSS
- **Base de données**: Supabase
- **Authentification**: Supabase Auth
- **État**: React Hooks