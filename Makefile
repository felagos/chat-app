.PHONY: help up down restart rebuild install dev-backend dev-frontend dev-mqs logs clean ps prisma-migrate prisma-studio

# ========================================================
# Development Setup
# ========================================================

help:
	@echo "==============================================================="
	@echo "        Chat App - Escalable Docker Compose Commands           "
	@echo "==============================================================="
	@echo ""
	@echo "[Docker Services]"
	@echo "  make up              -> Levantar todos los servicios"
	@echo "  make down            -> Bajar todos los servicios"
	@echo "  make restart         -> Reiniciar servicios (down + up)"
	@echo "  make rebuild         -> Re-build de los servicios"
	@echo ""
	@echo "[Development]"
	@echo "  make install         -> Instalar dependencias"
	@echo "  make dev-backend     -> Ejecutar backend en modo desarrollo"
	@echo "  make dev-frontend    -> Ejecutar frontend en modo desarrollo"
	@echo "  make dev-mqs         -> Ejecutar message-queue-service en desarrollo"
	@echo ""
	@echo "[Monitoring]"
	@echo "  make logs            -> Ver logs de todos los servicios"
	@echo "  make logs-backend    -> Ver logs del backend"
	@echo "  make logs-mqs        -> Ver logs de message-queue-service"
	@echo "  make ps              -> Ver estado de contenedores"
	@echo ""
	@echo "[Database]"
	@echo "  make prisma-migrate  -> Ejecutar migraciones de Prisma"
	@echo "  make prisma-studio   -> Abrir Prisma Studio"
	@echo ""
	@echo "[Utilities]"
	@echo "  make clean           -> Limpiar contenedores y volúmenes"
	@echo ""

# ========================================================
# Docker Services
# ========================================================

up:
	@echo "[UP] Levantando servicios escalados..."
	@echo "  - 3 instancias de Backend"
	@echo "  - 3 instancias de Message Queue Service"
	@echo "  - 2 Load Balancers (Nginx)"
	docker-compose up -d
	@echo "[OK] Servicios levantados exitosamente"
	@echo ""
	@echo "[INFO] Servicios disponibles:"
	@echo "  Backend (LB):        http://localhost:80"
	@echo "  Backend-1:           http://localhost:3010"
	@echo "  Backend-2:           http://localhost:3011"
	@echo "  Backend-3:           http://localhost:3012"
	@echo "  MQS (LB):            http://localhost:3001"
	@echo "  MQS-1:               http://localhost:3001"
	@echo "  MQS-2:               http://localhost:3002"
	@echo "  MQS-3:               http://localhost:3003"
	@echo "  RabbitMQ Admin:      http://localhost:15672"
	@echo "  PostgreSQL:          localhost:5432"
	@echo "  MongoDB:             localhost:27017"
	@echo "  Redis:               localhost:6379"

down:
	@echo "[DOWN] Bajando todos los servicios..."
	docker-compose down
	@echo "[OK] Servicios detenidos"

restart: down up
	@echo "[OK] Servicios reiniciados"

rebuild:
	@echo "[BUILD] Re-build de los servicios..."
	docker-compose build
	@echo "[OK] Build completado"

# ========================================================
# Development Mode
# ========================================================

install:
	@echo "[INSTALL] Instalando dependencias del message-queue-service..."
	cd message-queue-service && bun install
	@echo "[INSTALL] Instalando dependencias del backend..."
	cd backend && bun install
	@echo "[INSTALL] Instalando dependencias del frontend..."
	cd frontend && bun install
	@echo "[OK] Todas las dependencias instaladas"

dev-backend:
	@echo "[DEV] Iniciando backend en modo desarrollo..."
	cd backend && bun run dev

dev-frontend:
	@echo "[DEV] Iniciando frontend en modo desarrollo..."
	cd frontend && bun run dev

dev-mqs:
	@echo "[DEV] Iniciando message-queue-service en modo desarrollo..."
	cd message-queue-service && bun run dev

# ========================================================
# Monitoring & Logging
# ========================================================

logs:
	@echo "[LOGS] Mostrando logs de todos los servicios..."
	docker-compose logs -f

logs-backend:
	@echo "[LOGS] Mostrando logs del backend..."
	docker-compose logs -f backend-1 backend-2 backend-3

logs-mqs:
	@echo "[LOGS] Mostrando logs del message-queue-service..."
	docker-compose logs -f message-queue-service-1 message-queue-service-2 message-queue-service-3

ps:
	@echo "[STATUS] Estado de contenedores:"
	docker-compose ps

# ========================================================
# Database
# ========================================================

prisma-migrate:
	@echo "[MIGRATE] Ejecutando migraciones de Prisma..."
	cd backend && bun run prisma:migrate

prisma-studio:
	@echo "[STUDIO] Abriendo Prisma Studio..."
	cd backend && bun run prisma:studio

# ========================================================
# Cleanup
# ========================================================

clean:
	@echo "[CLEAN] Limpiando contenedores y volúmenes..."
	docker-compose down -v
	@echo "[OK] Limpieza completada"

clean-images:
	@echo "[CLEAN] Removiendo imágenes de Docker..."
	docker rmi chat-app-backend chat-app-message-queue-service 2>/dev/null || true
	@echo "[OK] Imágenes removidas"

.DEFAULT_GOAL := help
