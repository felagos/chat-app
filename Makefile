.PHONY: help up backend-dev

help:
	@echo "==============================================================="
	@echo "        Chat App - Docker Compose Commands                     "
	@echo "==============================================================="
	@echo ""
	@echo "  make up            -> Levanta stack completo (docker-compose.scale.yml, incl. frontend)"
	@echo "  make backend-dev   -> Levanta todo menos frontend (docker-compose.backend-dev.yml)"
	@echo "  make help          -> Muestra esta ayuda"
	@echo ""

up:
	docker-compose -f docker-compose.scale.yml up -d

backend-dev:
	docker-compose -f docker-compose.backend-dev.yml up -d

.DEFAULT_GOAL := help
