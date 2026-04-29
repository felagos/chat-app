# GitHub Copilot Agent — React + Ant Design + React Query + SASS + CSS Modules

## Rol del Agente

Eres un experto en desarrollo de aplicaciones web con React. Tu stack principal es:

- **UI**: Ant Design (antd) v5+
- **Data Fetching**: TanStack React Query v5+
- **Estilos**: SASS + CSS Modules (`.module.scss`)
- **Context7 MCP**: Usa Context7 para consultar la documentación actualizada de librerías antes de generar código

---

## Instrucciones Core

### 1. Consultar Context7 MCP antes de generar código

Antes de escribir componentes o lógica, siempre consulta la documentación oficial usando Context7:

- Para **Ant Design**: `use context7` para obtener el ID de librería y consultar componentes, props y APIs actualizadas.
- Para **React Query**: `use context7` para consultar hooks como `useQuery`, `useMutation`, `useInfiniteQuery` y sus opciones más recientes.

Ejemplo de flujo:
```
1. Usuario pide: "Crea una tabla con datos de una API"
2. Copilot consulta Context7: documentación de Table de Ant Design
3. Copilot consulta Context7: documentación de useQuery de React Query
4. Copilot genera el código con las APIs correctas y actualizadas
```

### 2. Fetching — Siempre React Query

**REGLA OBLIGATORIA**: Todo fetch de datos debe usar React Query. Nunca uses `useEffect` + `fetch`/`axios` directo para obtener datos del servidor.

#### Patrones obligatorios:

```tsx
// ✅ CORRECTO — Fetch de datos
import { useQuery } from "@tanstack/react-query";

const { data, isPending, isError, error } = useQuery({
  queryKey: ["users", filters],
  queryFn: () => fetchUsers(filters),
  staleTime: 5 * 60 * 1000,
});

// ✅ CORRECTO — Mutaciones
import { useMutation, useQueryClient } from "@tanstack/react-query";

const queryClient = useQueryClient();
const mutation = useMutation({
  mutationFn: createUser,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["users"] });
  },
});

// ❌ INCORRECTO — No usar esto para server data
const [data, setData] = useState([]);
useEffect(() => {
  fetch("/api/users").then(...).then(setData);
}, []);
```

#### Query Keys — Convención:

```tsx
// Usa arrays descriptivos y consistentes
["resource"]                        // lista general
["resource", id]                    // ítem específico
["resource", "list", filters]       // lista con filtros
["resource", "infinite", filters]   // paginación infinita
```

#### QueryClient global — Configuración base:

```tsx
// src/lib/queryClient.ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

---

### 3. UI — Siempre Ant Design

**REGLA OBLIGATORIA**: Todo componente de interfaz debe usar Ant Design. No uses Tailwind, Bootstrap, MUI ni CSS custom para componentes que Ant Design ya provee.

#### Importaciones correctas (v5+):

```tsx
// ✅ Tree-shaking automático en antd v5
import { Button, Table, Form, Input, Select, Space } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
```

#### Patrones de UI obligatorios:

**Layouts:**
```tsx
import { Layout, Menu, Breadcrumb } from "antd";
const { Header, Sider, Content, Footer } = Layout;
```

**Feedback de loading — usa Ant Design:**
```tsx
// ✅ Con React Query + Ant Design
const { data, isPending } = useQuery({ queryKey: ["users"], queryFn: fetchUsers });

return <Spin spinning={isPending}><Table dataSource={data} /></Spin>;

// O con Skeleton
if (isPending) return <Skeleton active />;
```

**Mensajes de error:**
```tsx
import { Alert, message, notification } from "antd";

// Para errores de query
if (isError) return <Alert type="error" message={error.message} showIcon />;

// Para éxito en mutación
message.success("Guardado correctamente");
```

**Formularios — siempre Form de Ant Design:**
```tsx
import { Form, Input, Button } from "antd";
import { useMutation } from "@tanstack/react-query";

const [form] = Form.useForm();

const mutation = useMutation({
  mutationFn: submitData,
  onSuccess: () => {
    message.success("Enviado!");
    form.resetFields();
  },
  onError: () => message.error("Error al enviar"),
});

const onFinish = (values) => mutation.mutate(values);

return (
  <Form form={form} layout="vertical" onFinish={onFinish}>
    <Form.Item name="name" label="Nombre" rules={[{ required: true }]}>
      <Input />
    </Form.Item>
    <Button type="primary" htmlType="submit" loading={mutation.isPending}>
      Guardar
    </Button>
  </Form>
);
```

---

### 4. Estructura de Archivos Recomendada

```
src/
├── api/                          # Funciones de fetching (puras, sin hooks)
│   ├── users.ts
│   └── products.ts
├── hooks/                        # Custom hooks con React Query
│   ├── useUsers.ts
│   └── useProducts.ts
├── components/                   # Componentes reutilizables
│   ├── UserTable/
│   │   ├── UserTable.tsx         # Componente
│   │   ├── UserTable.module.scss # Estilos del componente
│   │   └── index.ts              # Re-export público
│   └── ProductForm/
│       ├── ProductForm.tsx
│       ├── ProductForm.module.scss
│       └── index.ts
├── pages/                        # Páginas de la app
│   └── UsersPage/
│       ├── UsersPage.tsx
│       ├── UsersPage.module.scss
│       └── index.ts
├── styles/                       # SASS global y variables compartidas
│   ├── _variables.scss           # Variables SASS globales
│   ├── _mixins.scss              # Mixins reutilizables
│   ├── _breakpoints.scss         # Breakpoints responsive
│   └── global.scss               # Estilos base y reset
├── lib/
│   └── queryClient.ts
└── App.tsx
```

**REGLA OBLIGATORIA — Co-location de componentes:**
Todo componente debe vivir en su propia carpeta con el mismo nombre. La carpeta debe contener:
1. `ComponentName.tsx` — el componente
2. `ComponentName.module.scss` — sus estilos
3. `index.ts` — re-export para importaciones limpias

```ts
// src/components/UserTable/index.ts
export { UserTable } from "./UserTable";
export type { UserTableProps } from "./UserTable";
```

**Separación de lógica — patrón hooks:**
```tsx
// src/hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchUsers, createUser, updateUser, deleteUser } from "@/api/users";

export const useUsers = (filters?: UserFilters) =>
  useQuery({
    queryKey: ["users", "list", filters],
    queryFn: () => fetchUsers(filters),
  });

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
};
```

---

### 5. Estilos — SASS + CSS Modules

**REGLA OBLIGATORIA**: Todos los estilos específicos de un componente van en su archivo `.module.scss` co-localizado. Nunca uses `style={{}}` inline para layout ni escribas CSS en archivos globales para estilos de componentes.

#### Uso de CSS Modules en componentes:

```tsx
// src/components/UserTable/UserTable.tsx
import styles from "./UserTable.module.scss";

const UserTable = () => (
  <div className={styles.container}>
    <header className={styles.header}>
      <h2 className={styles.title}>Usuarios</h2>
    </header>
    <div className={styles.tableWrapper}>
      <Table className={styles.table} ... />
    </div>
  </div>
);
```

```scss
// src/components/UserTable/UserTable.module.scss
@use "@/styles/variables" as *;
@use "@/styles/mixins" as *;

.container {
  padding: $spacing-lg;
  background: $color-bg-elevated;
  border-radius: $border-radius-lg;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $spacing-md;
}

.title {
  font-size: $font-size-xl;
  font-weight: 600;
  color: $color-text-primary;
  margin: 0;
}

.tableWrapper {
  overflow-x: auto;
}

.table {
  width: 100%;
}
```

#### Combinación de clases con `clsx`:

```tsx
import clsx from "clsx";
import styles from "./Card.module.scss";

const Card = ({ active, disabled, className }) => (
  <div
    className={clsx(
      styles.card,
      active && styles.active,
      disabled && styles.disabled,
      className
    )}
  />
);
```

#### Sobrescribir estilos de Ant Design con CSS Modules:

```scss
// Usa :global para sobrescribir clases de antd dentro del scope del módulo
.tableWrapper {
  :global {
    .ant-table-thead > tr > th {
      background-color: $color-bg-subtle;
      font-weight: 600;
    }

    .ant-table-row:hover > td {
      background-color: $color-primary-light !important;
    }
  }
}
```

#### Variables SASS globales — estructura base:

```scss
// src/styles/_variables.scss

// Espaciado
$spacing-xs:  4px;
$spacing-sm:  8px;
$spacing-md:  16px;
$spacing-lg:  24px;
$spacing-xl:  32px;
$spacing-2xl: 48px;

// Tipografía
$font-size-sm:   12px;
$font-size-base: 14px;
$font-size-md:   16px;
$font-size-lg:   18px;
$font-size-xl:   20px;
$font-size-2xl:  24px;

// Colores (sincronizados con tokens de Ant Design)
$color-primary:       #1677ff;
$color-primary-light: #e6f4ff;
$color-text-primary:  #000000e0;
$color-text-secondary:#00000073;
$color-bg-base:       #ffffff;
$color-bg-elevated:   #ffffff;
$color-bg-subtle:     #fafafa;
$color-border:        #d9d9d9;

// Border radius
$border-radius-sm: 4px;
$border-radius-md: 6px;
$border-radius-lg: 8px;

// Sombras
$shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06);
$shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
$shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
```

```scss
// src/styles/_mixins.scss
@use "variables" as *;

// Responsive
@mixin mobile {
  @media (max-width: 767px) { @content; }
}
@mixin tablet {
  @media (min-width: 768px) and (max-width: 1199px) { @content; }
}
@mixin desktop {
  @media (min-width: 1200px) { @content; }
}

// Truncar texto
@mixin truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// Flex helpers
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

@mixin flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
```

#### Ejemplo completo de componente con estilos co-localizados:

```
src/components/ProductCard/
├── ProductCard.tsx
├── ProductCard.module.scss
└── index.ts
```

```tsx
// ProductCard.tsx
import { Tag, Button } from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";
import clsx from "clsx";
import styles from "./ProductCard.module.scss";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  featured?: boolean;
  onAddToCart: (id: string) => void;
}

export const ProductCard = ({ product, featured, onAddToCart }: ProductCardProps) => (
  <article className={clsx(styles.card, featured && styles.featured)}>
    <div className={styles.imageWrapper}>
      <img src={product.image} alt={product.name} className={styles.image} />
    </div>
    <div className={styles.body}>
      <h3 className={styles.name}>{product.name}</h3>
      <Tag color="blue" className={styles.category}>{product.category}</Tag>
      <p className={styles.price}>${product.price}</p>
    </div>
    <footer className={styles.footer}>
      <Button
        type="primary"
        icon={<ShoppingCartOutlined />}
        block
        onClick={() => onAddToCart(product.id)}
      >
        Agregar al carrito
      </Button>
    </footer>
  </article>
);
```

```scss
// ProductCard.module.scss
@use "@/styles/variables" as *;
@use "@/styles/mixins" as *;

.card {
  display: flex;
  flex-direction: column;
  background: $color-bg-elevated;
  border: 1px solid $color-border;
  border-radius: $border-radius-lg;
  box-shadow: $shadow-sm;
  overflow: hidden;
  transition: box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    box-shadow: $shadow-md;
    transform: translateY(-2px);
  }

  &.featured {
    border-color: $color-primary;
    box-shadow: 0 0 0 2px $color-primary-light;
  }
}

.imageWrapper {
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: $color-bg-subtle;
}

.image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;

  .card:hover & {
    transform: scale(1.04);
  }
}

.body {
  flex: 1;
  padding: $spacing-md;
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.name {
  @include truncate;
  font-size: $font-size-md;
  font-weight: 600;
  color: $color-text-primary;
  margin: 0;
}

.category {
  align-self: flex-start;
}

.price {
  font-size: $font-size-xl;
  font-weight: 700;
  color: $color-primary;
  margin: $spacing-xs 0 0;
}

.footer {
  padding: $spacing-sm $spacing-md $spacing-md;
}
```

---

### 6. Paginación con Ant Design + React Query

```tsx
import { useState } from "react";
import { Table } from "antd";
import { useQuery } from "@tanstack/react-query";

const UsersPage = () => {
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 });

  const { data, isPending } = useQuery({
    queryKey: ["users", "list", pagination],
    queryFn: () => fetchUsers(pagination),
    placeholderData: (prev) => prev, // mantiene data anterior mientras carga
  });

  return (
    <Table
      dataSource={data?.items}
      loading={isPending}
      rowKey="id"
      pagination={{
        current: pagination.page,
        pageSize: pagination.pageSize,
        total: data?.total,
        onChange: (page, pageSize) => setPagination({ page, pageSize }),
      }}
      columns={columns}
    />
  );
};
```

---

### 7. Notificaciones y Feedback

```tsx
// Usa los hooks de notificación de Ant Design para mayor flexibilidad
import { App } from "antd";

const MyComponent = () => {
  const { message, notification, modal } = App.useApp();

  const mutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => message.success("Usuario eliminado"),
    onError: (err) => notification.error({
      message: "Error",
      description: err.message,
    }),
  });
};
```

---

### 8. Integración con ConfigProvider de Ant Design

Siempre configura el tema globalmente:

```tsx
// src/App.tsx
import { ConfigProvider, App as AntApp } from "antd";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "./lib/queryClient";
import esES from "antd/locale/es_ES";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={esES}
        theme={{
          token: {
            colorPrimary: "#1677ff",
            borderRadius: 8,
          },
        }}
      >
        <AntApp>
          <RouterProvider router={router} />
        </AntApp>
      </ConfigProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

---

## Reglas de Prioridad

| Situación | Solución Obligatoria |
|-----------|---------------------|
| Fetch de datos del servidor | `useQuery` (React Query) |
| Crear / actualizar / eliminar | `useMutation` (React Query) |
| Paginación | `useQuery` con `placeholderData` o `useInfiniteQuery` |
| Componentes UI | Ant Design |
| Loading states | `Spin` o `Skeleton` de Ant Design + `isPending` de React Query |
| Errores | `Alert` de Ant Design + `isError`/`error` de React Query |
| Formularios | `Form` de Ant Design + `useMutation` para submit |
| Estilos de componente | `.module.scss` co-localizado en la misma carpeta |
| Variables y mixins | Importar desde `@/styles/_variables.scss` y `@/styles/_mixins.scss` |
| Sobrescribir estilos de antd | `:global { }` dentro del `.module.scss` del componente |
| Documentación de APIs | Context7 MCP antes de escribir código |

---

## Prohibiciones

- ❌ No uses `useEffect` para fetch de datos del servidor
- ❌ No uses `useState` + `fetch`/`axios` directo para server state
- ❌ No uses librerías de UI distintas a Ant Design (no Tailwind components, no MUI)
- ❌ No escribas CSS custom para componentes que antd ya tiene
- ❌ No ignores los estados `isPending`, `isError` al renderizar
- ❌ No hardcodees query keys como strings simples (`"users"`) sin contexto
- ❌ No uses `style={{}}` inline para layout o estilos visuales
- ❌ No crees archivos `.scss` fuera de la carpeta del componente (salvo `src/styles/` para globales)
- ❌ No coloques un componente suelto sin su carpeta homónima y su `.module.scss`
- ❌ No uses clases CSS globales para estilos que son exclusivos de un componente

---

## Consultas a Context7 MCP — Cuándo y Cómo

### Cuándo consultar:
- Al usar un componente de Ant Design que no recuerdes con exactitud
- Al usar opciones avanzadas de React Query (`select`, `enabled`, `placeholderData`, etc.)
- Al actualizar código de versiones anteriores
- Ante dudas sobre props opcionales o deprecaciones

### Cómo consultar:
```
// En tu flujo de trabajo con Context7:
1. resolve-library-id: "ant-design" o "tanstack/react-query"
2. get-library-docs: con el topic específico (ej: "Table component", "useInfiniteQuery")
3. Genera el código basado en la documentación obtenida
```