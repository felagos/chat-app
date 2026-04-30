---
name: component-creator
description: "Creates React components following the project's co-location convention: each component gets its own folder containing the .tsx file and a co-located .module.scss styles file. Use this skill whenever the user asks to create, add, or scaffold a new React component, page, or UI element — especially in projects using Ant Design, SASS, and CSS Modules. Trigger on phrases like 'crea un componente', 'add a component', 'nuevo componente', 'haz un componente', 'create a page', 'nueva página', or any request to build a reusable UI piece. Always apply this skill before writing any component code so the folder structure, file naming, and SASS conventions are consistent."
---

# Component Creator

Crea componentes React siguiendo la convención de co-location: cada componente vive en su propia carpeta con el `.tsx` y su `.module.scss` juntos.

## Stack asumido

- **React** con TypeScript (`.tsx`)
- **Ant Design v5** para componentes UI
- **CSS Modules** + **SASS** (`.module.scss`) para estilos
- **TanStack React Query v5** si el componente necesita datos

Consulta Context7 MCP antes de usar componentes de Ant Design o hooks de React Query que no recuerdes con exactitud.

---

## Estructura obligatoria

Todo componente debe seguir esta estructura de carpeta:

```
src/
└── components/          # o pages/, layouts/, features/...
    └── ComponentName/
        ├── ComponentName.tsx        ← lógica + JSX
        ├── ComponentName.module.scss ← estilos co-localizados
        └── index.ts                 ← re-export público
```

**Reglas de nombrado:**
- La carpeta usa `PascalCase` y coincide exactamente con el nombre del componente.
- El archivo `.tsx` lleva el mismo nombre que la carpeta.
- El archivo de estilos es siempre `ComponentName.module.scss`.
- El `index.ts` sólo re-exporta; nunca contiene lógica.

---

## Paso a paso para crear un componente

### 1. Identificar tipo y ubicación

| Tipo | Carpeta |
|------|---------|
| Componente reutilizable | `src/components/ComponentName/` |
| Página / ruta | `src/pages/PageName/` |
| Layout / estructura | `src/layouts/LayoutName/` |
| Feature compleja | `src/features/FeatureName/components/ComponentName/` |

### 2. Generar los tres archivos

Siempre crea los tres archivos. Nunca omitas el `.module.scss` ni el `index.ts`.

#### `ComponentName.tsx`

```tsx
import styles from "./ComponentName.module.scss";
// Importa de antd según necesidad
// import { Button, Card } from "antd";

interface ComponentNameProps {
  // props tipadas
}

export const ComponentName = ({}: ComponentNameProps) => {
  return (
    <div className={styles.container}>
      {/* contenido */}
    </div>
  );
};
```

#### `ComponentName.module.scss`

```scss
@use "@/styles/variables" as *;    // variables del proyecto
@use "@/styles/mixins" as *;       // mixins del proyecto

.container {
  // estilos raíz del componente
}
```

#### `index.ts`

```ts
export { ComponentName } from "./ComponentName";
export type { ComponentNameProps } from "./ComponentName";
```

---

## Convenciones de estilos SASS + CSS Modules

### Importar variables y mixins globales

```scss
@use "@/styles/variables" as *;
@use "@/styles/mixins" as *;
```

Asume que el proyecto tiene:
- `src/styles/_variables.scss` — tokens de espaciado, color, tipografía
- `src/styles/_mixins.scss` — mixins responsive, flex helpers, truncado

Si no existen, crea un bloque de variables inline en el propio módulo mientras el proyecto los centraliza.

### Clases locales vs globales

```scss
// ✅ Clases locales (default en CSS Modules)
.container { }
.header { }

// ✅ Sobrescribir Ant Design dentro del scope
.wrapper {
  :global {
    .ant-table-thead > tr > th {
      background-color: $color-bg-subtle;
    }
  }
}

// ❌ Nunca pongas clases globales para estilos exclusivos del componente
:global(.my-component-title) { }
```

### Clases condicionales con `clsx`

```tsx
import clsx from "clsx";

<div className={clsx(
  styles.card,
  isActive && styles.active,
  isDisabled && styles.disabled,
  className          // permite class externa opcional
)} />
```

### Estados y variantes en SASS

```scss
.button {
  background: $color-primary;

  &:hover   { background: darken($color-primary, 8%); }
  &:active  { background: darken($color-primary, 15%); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }

  // Variantes por prop
  &.secondary {
    background: transparent;
    border: 1px solid $color-primary;
    color: $color-primary;
  }

  &.danger {
    background: $color-error;
  }
}
```

---

## Patrones comunes

### Componente con datos (React Query)

```tsx
// UserCard/UserCard.tsx
import { Spin, Alert } from "antd";
import { useQuery } from "@tanstack/react-query";
import styles from "./UserCard.module.scss";

interface UserCardProps {
  userId: string;
}

export const UserCard = ({ userId }: UserCardProps) => {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["users", userId],
    queryFn: () => fetchUser(userId),
  });

  if (isPending) return <Spin className={styles.spinner} />;
  if (isError)   return <Alert type="error" message={error.message} showIcon />;

  return (
    <article className={styles.card}>
      <h3 className={styles.name}>{data.name}</h3>
    </article>
  );
};
```

```scss
// UserCard/UserCard.module.scss
@use "@/styles/variables" as *;

.card {
  padding: $spacing-md;
  border: 1px solid $color-border;
  border-radius: $border-radius-lg;
  background: $color-bg-elevated;
}

.name {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $color-text-primary;
  margin: 0;
}

.spinner {
  display: block;
  margin: $spacing-xl auto;
}
```

### Componente con formulario (Ant Design + React Query)

```tsx
// CreateUserForm/CreateUserForm.tsx
import { Form, Input, Button } from "antd";
import { App } from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import styles from "./CreateUserForm.module.scss";

export const CreateUserForm = () => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      message.success("Usuario creado");
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => message.error("Error al crear"),
  });

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={(values) => mutation.mutate(values)}
      className={styles.form}
    >
      <Form.Item name="name" label="Nombre" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <div className={styles.actions}>
        <Button type="primary" htmlType="submit" loading={mutation.isPending}>
          Crear
        </Button>
      </div>
    </Form>
  );
};
```

### Componente de layout / página

```tsx
// UsersPage/UsersPage.tsx
import { Typography } from "antd";
import styles from "./UsersPage.module.scss";

const { Title } = Typography;

export const UsersPage = () => (
  <main className={styles.page}>
    <header className={styles.header}>
      <Title level={2} className={styles.title}>Usuarios</Title>
    </header>
    <section className={styles.content}>
      {/* contenido */}
    </section>
  </main>
);
```

```scss
// UsersPage/UsersPage.module.scss
@use "@/styles/variables" as *;
@use "@/styles/mixins" as *;

.page {
  padding: $spacing-xl;
  max-width: 1200px;
  margin: 0 auto;

  @include mobile {
    padding: $spacing-md;
  }
}

.header {
  @include flex-between;
  margin-bottom: $spacing-lg;
}

.title {
  margin: 0 !important;
}

.content {
  background: $color-bg-elevated;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
}
```

---

## Checklist antes de entregar el componente

- [ ] Carpeta creada con nombre en `PascalCase`
- [ ] `ComponentName.tsx` exporta el componente con nombre (no default export)
- [ ] `ComponentName.module.scss` existe y está importado en el `.tsx`
- [ ] `index.ts` re-exporta el componente y sus tipos
- [ ] Los estilos usan `@use "@/styles/variables"` y `@use "@/styles/mixins"`
- [ ] No hay `style={{}}` inline para layout o visuales
- [ ] Si tiene fetch: usa `useQuery` / `useMutation`, maneja `isPending` e `isError`
- [ ] Si tiene formulario: usa `Form` de Ant Design
- [ ] Clases condicionales usan `clsx`, no template literals

---

## Prohibiciones

- ❌ No crear el componente como archivo suelto fuera de su carpeta
- ❌ No omitir el `index.ts`
- ❌ No omitir el `.module.scss` aunque el componente "no necesite estilos aún"
- ❌ No usar `style={{}}` inline para spacing, color o layout
- ❌ No usar `useEffect` + `fetch` para datos del servidor
- ❌ No poner estilos globales para estilos que son exclusivos del componente