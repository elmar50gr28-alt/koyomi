# KOYOMI Master Spec

## Purpose

This document set is the canonical specification for KOYOMI. It fixes product decisions in Git so future design, implementation, and review do not depend on chat history.

## Canonical Source

The files under `docs/` are the single source of truth. If current implementation conflicts with this specification, report the gap and treat the specification as authoritative. Do not rewrite the specification to match implementation without an explicit decision.

## Specification Priority

1. `00_KOYOMI_MASTER_SPEC.md`
2. Domain specifications in this `docs/` directory
3. Newer entries in `DECISIONS.md`
4. `ROADMAP.md`
5. Current implementation

Legacy root documents such as `KOYOMI_RULES.md`, `ARCHITECTURE.md`, and `ROADMAP.md` remain as historical/supporting documents.

## Core Philosophy

KOYOMI is a world-ready integrated divination app and jyutsusu platform. It is not a novelty fortune app. The purpose is to help people read today and live today.

## Non-Negotiable Principles

- Mobile first: iPhone and smartphone operation has priority.
- PC screens are secondary for development and expert use.
- Offline first.
- Personal information is stored on the device by default.
- Beginners must be able to use KOYOMI without confusion.
- Experts must be able to inspect evidence, schools, settings, and confidence.
- All readings must be explainable.
- One shared person profile must serve all systems.
- Do not make users re-enter the same person data per divination system.
- Japan-only assumptions are forbidden. World names, birthplaces, and time zones are first-class requirements.
- Saved data compatibility must be preserved.
- Changes are not complete until iPhone Safari or an equivalent real mobile viewport has been checked.

## Rule Engine and AI Roles

Divination calculation is handled by deterministic rule engines and documented data. AI must not silently change calculations. AI, including Mitsunome, explains, translates, summarizes, and makes the result usable in daily language.

## Beginner and Pro Modes

Beginner screens show only the minimum useful inputs and plain-language results. Pro mode exposes roots, schools, calculation settings, confidence, and warnings.

## Production Protection

`main` is the stable production branch. Major changes that can affect the production app, shared profile model, storage, calculations, or routing must be developed on a feature branch and merged only after checklist completion.

## Specification Change Process

1. Add or update a decision in `DECISIONS.md`.
2. Update the relevant domain specification.
3. Check for conflicts against this master spec.
4. Update implementation only after the spec is settled.
5. Verify release checklist items before publishing.

## Required Reading for Codex

Before each task, Codex must read:

- `00_KOYOMI_MASTER_SPEC.md`
- The relevant domain specification
- `DECISIONS.md`
- `14_RELEASE_CHECKLIST.md`
- Root legacy docs only when useful for historical context

