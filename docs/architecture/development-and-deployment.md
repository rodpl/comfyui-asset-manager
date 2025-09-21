# Development and Deployment

## Local Development Setup
1. Run `./setup.sh` to install Poetry dependencies and pnpm packages (script covers both backend and frontend).
2. Activate Poetry shell or use `poetry run` for backend commands.
3. Install frontend deps manually if needed: `cd ui && pnpm install`.
4. Create symlink into your ComfyUI installation and start watcher: `./dev_server.sh` (links project into `custom_nodes` and runs `pnpm run watch`).
5. Restart ComfyUI after backend changes; frontend watcher serves updated assets automatically.
6. Configure required environment variables if overriding defaults (see `src/config.py`).

## Build and Deployment Process
- **Frontend build**: `cd ui && pnpm run build` – emits `dist/asset_manager` and locales.
- **Backend packaging**: Poetry project; ensure `poetry install --no-root` completes for prod environment.
- **Distribution**: Copy/symlink repository into ComfyUI `custom_nodes` and ensure built assets exist.
- **Environments**: Runs within local ComfyUI instances; no standalone deployment pipeline yet. <!-- Document deployment targets once release packaging is defined. -->
