# Mundial Bet 2026 — Setup en 3 pasos

---

## Paso 1: Crear proyecto en Supabase (gratis, 2 minutos)

1. Crea cuenta en https://supabase.com y haz clic en **New project**
2. Elige un nombre, contrasena de base de datos y region (US East recomendado)
3. Espera que termine de crearse (~1 minuto)
4. Ve a **Project Settings > API** y copia estos 3 valores:
   - `Project URL` → es tu `VITE_SUPABASE_URL`
   - `anon public` → es tu `VITE_SUPABASE_ANON_KEY`
   - `service_role` → es tu `SUPABASE_SERVICE_ROLE_KEY`
5. Ve a **Project Settings > Database > Connection string > URI**
   - Selecciona el modo **Transaction** (puerto 6543)
   - Copia la URL y reemplaza `[YOUR-PASSWORD]` por la contrasena que elegiste
   - Esa es tu `DATABASE_URL`

---

## Paso 2: Subir a GitHub y conectar con Vercel

```bash
cd betting-wc2026
git init
git add .
git commit -m "Mundial Bet 2026"
git remote add origin https://github.com/TU-USUARIO/betting-wc2026.git
git push -u origin main
```

1. Ve a https://vercel.com/new e importa tu repositorio de GitHub
2. En la seccion **Environment Variables** agrega las 4 variables:

   | Variable | Donde encontrarla |
   |---|---|
   | `VITE_SUPABASE_URL` | Supabase > Settings > API > Project URL |
   | `VITE_SUPABASE_ANON_KEY` | Supabase > Settings > API > anon public |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase > Settings > API > service_role |
   | `DATABASE_URL` | Supabase > Settings > Database > URI (Transaction mode) |

3. Haz clic en **Deploy**

---

## Paso 3: Inicializar el sistema (1 sola vez)

1. Abre tu app en la URL que te da Vercel (ej: `https://betting-wc2026.vercel.app`)
2. Aparece automaticamente la pantalla de **Configuracion inicial**
3. Ingresa tu nombre de admin, email y contrasena
4. Haz clic en **Inicializar sistema**
5. En 10-15 segundos crea todo: tablas, seguridad, 72 partidos y tu cuenta

**Listo.** Ahora puedes iniciar sesion con las credenciales que registraste.

---

## Flujo del sistema

- **Casa de apuestas**: partidos del Mundial 2026, apuesta fichas a ganador/empate
- **Banco**: historial de transacciones con balance
- **Admin**: crea usuarios, registra resultados, ve todas las apuestas
- **Auto-update**: cada 3 minutos actualiza los marcadores desde ESPN automaticamente
- **Liquidacion automatica**: al registrar un resultado, todas las apuestas se pagan solas

---

## Desarrollo local

```bash
cp .env.example .env.local
# Edita .env.local con tus claves de Supabase
npm install
npm run dev     # Solo el frontend (sin API routes)
```

Para probar las API routes localmente necesitas Vercel CLI:
```bash
npm i -g vercel
vercel dev
```
