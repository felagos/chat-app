.PHONY: help up backend-dev build build-backend-dev down clean restart

help:
	@echo "==============================================================="
	@echo "        Chat App - Docker Compose Commands                     "
	@echo "==============================================================="
	@echo ""
	@echo "  make up                -> Levanta stack completo (docker-compose.scale.yml, incl. frontend)"
	@echo "  make backend-dev       -> Levanta todo menos frontend (docker-compose.backend-dev.yml)"
	@echo "  make build             -> Buildea imágenes de docker-compose.scale.yml"
	@echo "  make build-backend-dev -> Buildea imágenes de docker-compose.backend-dev.yml"
	@echo "  make down              -> Detiene todos los contenedores"
	@echo "  make clean             -> Detiene contenedores y elimina volúmenes"
	@echo "  make restart           -> Reinicia stack (down + up)"
	@echo "  make help              -> Muestra esta ayuda"
	@echo ""

up:
	docker-compose -f docker-compose.scale.yml up -d

backend-dev:
	docker-compose -f docker-compose.backend-dev.yml up -d

build:
	docker-compose -f docker-compose.scale.yml build

build-backend-dev:
	docker-compose -f docker-compose.backend-dev.yml build

down:
	docker-compose -f docker-compose.scale.yml down

clean:
	docker-compose -f docker-compose.scale.yml down -v

restart: down up

.DEFAULT_GOAL := help
