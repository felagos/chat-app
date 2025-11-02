# Chat App - Frontend

Interfaz web moderna para la aplicación de chat en tiempo real construida con React, TypeScript y Vite.

## Stack Tecnológico

- **React 19**: UI library
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool
- **React Router**: SPA routing
- **Zustand**: State management
- **Socket.io Client**: Real-time communication
- **TanStack Query**: Data fetching & caching
- **React Hook Form**: Form management
- **SCSS**: Styling

## Requisitos

- Node.js 18+
- Bun 1.0+ (recomendado) o npm/yarn

## Instalación

```bash
# Instalar dependencias
bun install

# O con npm/yarn
npm install
yarn install
```

## Variables de Entorno

Crear archivo `.env.local`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=http://localhost:3000
```

## Desarrollo

```bash
# Iniciar servidor de desarrollo
bun run dev

# Verificar tipos TypeScript
bun run type-check

# Lint
bun run lint
```

El servidor estará disponible en `http://localhost:5173`

## Build

```bash
# Build para producción
bun run build

# Preview del build
bun run preview
```

## Estructura del Proyecto

```
src/
├── app/              # Páginas principales (chat, auth)
├── components/
│   ├── chat/         # ChatList, MessageList, MessageInput
│   ├── auth/         # Auth components
│   └── layout/       # Header, Layout components
├── hooks/            # Custom React hooks
│   ├── useSocket     # WebSocket management
│   ├── useChat       # Chat logic
│   └── useAuth       # Authentication
├── lib/
│   ├── socket.ts     # Socket.io client
│   ├── api.ts        # API client & TanStack Query
│   └── utils.ts      # Utility functions
├── store/            # Zustand stores
│   ├── authStore.ts
│   └── chatStore.ts
├── types/            # TypeScript types
└── styles/           # SCSS stylesheets
```

## Características

✅ Autenticación JWT
✅ Chat en tiempo real con WebSocket
✅ Soporte de múltiples conversaciones
✅ Indicadores de escritura
✅ Lista de conversaciones actualizada
✅ Interfaz responsive
✅ Estado persistente
✅ Type-safe con TypeScript

## API Integration

El frontend se conecta a la API backend en `http://localhost:3000/api` y al servidor WebSocket en `http://localhost:3000`.

### Endpoints principales:

- `POST /auth/register` - Registrar usuario
- `POST /auth/login` - Iniciar sesión
- `GET /conversations` - Obtener conversaciones
- `GET /conversations/:id/messages` - Obtener mensajes
- `POST /conversations` - Crear conversación

### Eventos WebSocket:

- `send_message` - Enviar mensaje
- `typing` - Indicar que está escribiendo
- `new_message` - Mensaje recibido
- `presence_update` - Actualización de presencia

## Notas de Desarrollo

- El estado se persiste en localStorage via Zustand
- Las consultas se cachean por 5 minutos
- Los tokens se almacenan en localStorage
- Las reconexiones WebSocket se reintentan automáticamente

## Troubleshooting

**Error: Cannot find module 'react-router-dom'**
```bash
bun add react-router-dom
```

**Error: CORS**
Verificar que el backend tiene CORS habilitado para `http://localhost:5173`

**WebSocket no conecta**
Verificar que `VITE_WS_URL` apunta al servidor backend correcto

## Contributing

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## License

MIT
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
