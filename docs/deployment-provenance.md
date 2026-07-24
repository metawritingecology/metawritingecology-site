# Deployment Provenance

## Purpose

This document describes how deployment provenance for the public website is represented and bounded.

It provides a public governance summary of the relationship between the production service, deployment state, build and source context, and deployed-artifact identity.

## Scope

This document is limited to deployment provenance for the public website.

It does not establish or modify infrastructure configuration, production behavior, repository authority, registry status, or MWE classification.

## Evidence model

Deployment provenance depends on relationships across distinct evidence layers:

- repository evidence describes source content and history;
- production evidence describes observed public behavior;
- build evidence describes the source context and output associated with a build;
- deployment evidence describes the deployment state represented by the platform;
- artifact-level evidence describes bounded similarities between public output and repository artifacts.

Deployment provenance emerges from the relationships between these evidence layers rather than from any single source.

## Current status

Deployment provenance is `PARTIALLY VERIFIED`.

Reviewed read-only evidence supports the relationship between the observed deployment state, its associated build context, and the expected public website source context. However, the exact full source revision and deployed-artifact identity were not completely established.

## Evidence boundary

Repository evidence does not independently establish active production state. Production observations do not independently identify the underlying source revision or deployed bundle. Build and deployment records describe bounded relationships within their respective systems.

The exact full source revision was not captured in the reviewed evidence. Complete deployed-bundle identity and a complete artifact-to-deployment content mapping also remain unverified. These boundaries prevent promotion of the status to `VERIFIED`.

## Public boundary

This public document provides a limited representation of deployment-provenance status. Detailed governance records, supporting evidence, and operational identifiers are maintained separately and are not represented by this public surface.

This repository document does not represent the complete MWE governance archive, methodology, registry, or authority structure.
