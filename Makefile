.PHONY: help up down restart rebuild install dev-backend

help:
	@echo "==============================================================="
	@echo "        Chat App - Docker Compose Makefile Commands           "
	@echo "==============================================================="
	@echo ""
	@echo "[Docker Services]"
	@echo "  make up              -> Levantar todos los servicios"
	@echo "  make down            -> Bajar todos los servicios"
	@echo "  make restart         -> Reiniciar servicios (down + up)"
	@echo "  make rebuild         -> Re-build de los servicios"
	@echo ""
	@echo "[Backend Development]"
	@echo "  make install         -> Instalar dependencias del backend"
	@echo "  make dev-backend     -> Ejecutar backend en modo desarrollo"
	@echo ""

# ========================================================
# Docker Compose Commands
# ========================================================

up:
	@echo "[UP] Levantando todos los servicios..."
	docker-compose up -d
	@echo "[OK] Servicios levantados exitosamente"
	@echo ""
	@echo "[INFO] Servicios disponibles:"
	@echo "  Backend:     http://localhost:3000"
	@echo "  PostgreSQL:  localhost:5432"
	@echo "  MongoDB:     localhost:27017"
	@echo "  Redis:       localhost:6379"
	@echo "  RabbitMQ:    http://localhost:15672"

down:
	@echo "[DOWN] Bajando todos los servicios..."
	docker-compose down
	@echo "[OK] Servicios detenidos"

restart: down up
	@echo "[OK] Servicios reiniciados"

rebuild:
	@echo "[BUILD] Re-build de los servicios..."
	docker-compose build --no-cache
	@echo "[OK] Build completado"
	@echo ""
	@echo "Para levantar los servicios ejecuta: make up"

# ========================================================
# Backend Development Commands
# ========================================================

install:
	@echo "[INSTALL] Instalando dependencias del backend con Bun..."
	cd backend && bun install
	@echo "[OK] Dependencias instaladas"

dev-backend:
	@echo "[DEV] Iniciando backend en modo desarrollo..."
	cd backend && bun run dev

.DEFAULT_GOAL := help
