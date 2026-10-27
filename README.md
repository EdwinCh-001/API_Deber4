# Rick and Morty: catálogo y favoritos offline

Aplicación móvil con Expo Router, React Native y TanStack Query. El catálogo se
lee desde la [Rick and Morty API](https://rickandmortyapi.com/documentation) y
los favoritos personales se crean y editan en el recurso `favorites` de MockAPI.

## Configuración

Instala las dependencias y arranca Expo:

```bash
npm install
npx expo start
```

La API pública funciona por defecto con
`https://rickandmortyapi.com/api`. Opcionalmente se puede definir
`EXPO_PUBLIC_API_URL` como la URL base de otra instancia compatible. Para las
escrituras, configura `EXPO_PUBLIC_MOCKAPI_URL` con la URL base del proyecto
MockAPI (sin añadir `/favorites`; el cliente agrega ese recurso).

Por ejemplo, crea un `.env` local con esta forma y reemplaza el valor de MockAPI
por la URL real proporcionada para el proyecto:

```dotenv
EXPO_PUBLIC_API_URL=https://rickandmortyapi.com/api
EXPO_PUBLIC_MOCKAPI_URL=https://<proyecto>.mockapi.io/api/v1
```

No se incluye una URL inventada para MockAPI: las operaciones de favoritos
requieren la URL específica ya configurada para el proyecto.

## Estructura relevante

```text
src/
  api/
    characters.ts       # GET de personajes de la API pública
    favorites.ts        # GET, POST y PUT del recurso MockAPI
  app/
    _layout.tsx         # Query persistente y persister de AsyncStorage
    index.tsx            # Catálogo, acciones y estado visible de mutaciones
  hooks/
    useFavorites.ts     # Consultas y mutaciones de favoritos
  lib/
    onlineManager.ts    # Estado de conexión de Expo Network
    queryClient.ts      # QueryClient y mutation defaults reanudables
  queryKeys.ts          # Jerarquía única de claves
  queryTimes.ts         # staleTime y gcTime por origen de datos
  types/
    characters.ts
    favorites.ts
```

## Decisiones técnicas

### Fuentes de datos y claves

`getCharacters` lee `/character` de Rick and Morty API. `getFavorites`,
`createFavorite` y `updateFavorite` operan sobre `/favorites` en MockAPI. El
`id` es el identificador `objectId` automático de MockAPI. Se usa tal cual para
construir la ruta REST `/favorites/{id}` al editar el registro con `PUT`.

En `queryKeys.ts`, las claves se agrupan por dominio y después por tipo:

- `characters.all` es la raíz de todo el catálogo. `characters.lists()` es el
  prefijo de listas y `characters.list()` identifica la consulta de catálogo.
  `characters.details()` y `characters.detail(id)` reservan el mismo patrón
  jerárquico para consultas por personaje.
- `favorites.all` es la raíz de los datos propios. `favorites.lists()` y
  `favorites.list()` identifican la colección de MockAPI; `favorites.details()`
  y `favorites.detail(id)` permiten invalidar un registro individual cuando se
  consulten detalles propios.
- `mutations.createFavorite` y `mutations.updateFavorite` dan identidad a las
  operaciones de escritura y permiten filtrar su estado pendiente.

Las claves de detalle están preparadas para consultas por id sin crear GETs de
detalle que el diseño actual no necesita.

### Invalidación tras crear y editar

La creación invalida `queryKeys.favorites.lists()`. De ese modo la consulta
`favorites.list()` queda marcada obsoleta y se vuelve a cargar para reflejar el
registro que MockAPI acaba de crear. No se invalida el detalle: todavía no hay
un detalle consultado que actualizar, y el resultado de creación se representa
en la colección.

La edición invalida tanto `queryKeys.favorites.lists()` como
`queryKeys.favorites.detail(updated.id)`. La lista debe volver a reflejar la
nota o el estado actualizado y el detalle del mismo registro no puede quedar
con datos antiguos. Las claves de Rick and Morty API no se invalidan: editar
una nota propia no modifica el catálogo público.

### Caché: `staleTime`, `gcTime` y persistencia

Los valores se centralizan en `queryTimes.ts`:

| Origen | `staleTime` | `gcTime` | Motivo |
|---|---:|---:|---|
| Rick and Morty API | 5 minutos | 48 horas | Los personajes públicos cambian poco; reutilizar el catálogo reduce llamadas. La caché permanece para un uso offline prolongado. |
| MockAPI | 30 segundos | 24 horas | Los favoritos se modifican desde la app y conviene volver a validar la colección pronto; conservarlos un día permite leerlos offline. |

`staleTime` determina cuánto tiempo una consulta se considera fresca y evita
refetches automáticos innecesarios. No elimina datos. `gcTime` determina cuánto
tiempo se conserva en memoria una consulta inactiva.

`PersistQueryClientProvider` guarda el estado con el persister de
`@tanstack/query-async-storage-persister` y AsyncStorage. El `maxAge` del
persister es 12 horas: si hay una instantánea válida, se hidrata antes de que
las consultas montadas comiencen sus peticiones. Por eso un catálogo guardado
puede mostrarse mientras se refresca la red; un error de refetch no oculta los
datos ya disponibles.

Todos los `gcTime` específicos (24 o 48 horas) y el valor predeterminado del
cliente (48 horas) son superiores al `maxAge` de 12 horas. Si `gcTime` fuera
menor que `maxAge`, TanStack Query podría eliminar de la caché en memoria una
consulta inactiva antes de que venciera la instantánea persistida. En
consecuencia, la persistencia aún podría contener datos considerados vigentes,
pero estos no se conservarían en la caché activa durante toda esa ventana y el
beneficio offline sería menos predecible. La regla práctica es mantener
`gcTime >= maxAge`.

### Mutaciones offline y estado pendiente

`onlineManager` recibe el estado inicial y los cambios de conectividad de
`expo-network`. Las mutaciones usan `networkMode: "online"` y sus funciones se
registran con `setMutationDefaults` antes de hidratar el cliente. Este registro
es necesario porque una mutación restaurada desde AsyncStorage necesita
recuperar su `mutationFn`, que no puede serializarse dentro de la caché.

Al completar la hidratación, `onSuccess` llama a `resumePausedMutations()`. El
cliente también observa el `onlineManager` para reanudar automáticamente las
mutaciones pausadas al recuperar conexión. Así, tanto al abrir la app como al
volver a estar online se reanudan las escrituras. La pantalla usa
`useMutationState` para mostrar el número de mutaciones pendientes y distinguir
las pausadas offline de las que se están enviando.

El indicador comunica el estado real de la mutación, pero no actualiza la lista
de favoritos de forma optimista: la lista se reconcilia con la respuesta de
MockAPI mediante las invalidaciones al completar la operación.
