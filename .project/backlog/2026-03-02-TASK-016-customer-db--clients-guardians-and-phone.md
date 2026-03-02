---
title: "Customer DB — Clients, Guardians, and Phone Numbers"
created: 2026-03-02T01:39:53.657Z
priority: P1-L
status: backlog
tags: [feat]
---

# Customer DB — Clients, Guardians, and Phone Numbers

Create customer database with full relational model. SQLite migrations: customers table (id UUID, name TEXT, date_of_birth DATE NULL, notes TEXT NULL, created_at, updated_at); guardians table (id UUID, customer_id FK, name TEXT, created_at); guardian_phones table (id UUID, guardian_id FK, phone TEXT, label TEXT NULL — e.g. "celular", "trabalho", created_at). Cascade deletes on FK. Repositories: CustomerRepository (findById, findByName LIKE, create, update, softDelete), GuardianRepository (findByCustomer, create, update, delete), GuardianPhoneRepository (findByGuardian, create, delete). IPC channels: db:search-customers (name query, returns list), db:get-customer (id), db:save-customer, db:save-guardian, db:delete-guardian, db:save-guardian-phone, db:delete-guardian-phone. Shared Zod schemas for all DTOs. CustomersPage: list with search input, click to open customer modal. Customer modal: name, date_of_birth, notes; Guardians section — repeater (add/remove guardian rows, each with name + phone repeater — add/remove phone rows with label). Also: update check-in form to include customer search autocomplete (async, type-to-search with debounce) that pre-fills child_name and guardian fields from selected customer record. customer_id FK should be stored in sessions table as optional (new migration).

