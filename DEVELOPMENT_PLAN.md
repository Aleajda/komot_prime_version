# План разработки веб-приложения для внутри-командного взаимодействия

## 1. Описание проекта

Веб-приложение для организации работы команд, управления проектами и задачами с возможностью общения в реальном времени. Платформа обеспечивает прозрачность работы, видимость вклада каждого участника и эффективное взаимодействие внутри команд.

### Целевая аудитория
- Команды разработчиков
- Проектные группы
- Организации, работающие над совместными задачами

## 2. Технический стек

### Frontend
- **Framework**: Next.js 14+ (App Router) с TypeScript
- **State Management**: Redux Toolkit
- **UI библиотека**: Tailwind CSS (кастомная тёмная тема)
- **UI компоненты**: Shadcn/ui / Radix UI
- **Роутинг**: Next.js App Router (встроенный)
- **WebSocket клиент**: Socket.io-client
- **HTTP клиент**: Axios
- **Формы**: React Hook Form + Zod
- **Графики/Визуализация**: Recharts / Chart.js
- **Анимации**: Framer Motion
- **Уведомления**: Sonner / React Hot Toast
- **Server Components**: Next.js Server Components для оптимизации

### Backend
- **Runtime**: Java 17+
- **Framework**: Spring Boot 3.x
- **База данных**: PostgreSQL
- **ORM**: Spring Data JPA (Hibernate)
- **Миграции**: Flyway / Liquibase
- **WebSocket**: Spring WebSocket (STOMP)
- **Аутентификация**: Spring Security + JWT
- **Валидация**: Bean Validation (Jakarta Validation)
- **Файловое хранилище**: AWS S3 / Local Storage (для начала)
- **Тестирование**: JUnit 5 + Spring Boot Test + MockMvc
- **Сборка**: Maven / Gradle
- **Документация API**: Springdoc OpenAPI (Swagger)

### Инфраструктура
- **Контейнеризация**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Хостинг**: Vercel (Frontend) / Railway / AWS / Heroku (Backend)
- **Build Tool**: Maven / Gradle

## 3. Архитектура системы

### 3.1 Общая архитектура
```
┌─────────────┐
│   Frontend  │ (Next.js + TypeScript)
│   (SSR/SSG) │
└──────┬──────┘
       │ HTTP/REST
       │ WebSocket (STOMP)
┌──────▼──────┐
│   Backend   │ (Spring Boot)
│   (REST API)│
└──────┬──────┘
       │
┌──────▼──────┐
│  PostgreSQL │
│  Database   │
└─────────────┘
```

### 3.2 Модульная структура Backend (Spring Boot)
- **Auth Module**: Регистрация, авторизация, JWT (Spring Security)
- **User Module**: Управление пользователями (UserController, UserService, UserRepository)
- **Team Module**: Управление командами (TeamController, TeamService, TeamRepository)
- **Project Module**: Управление проектами (ProjectController, ProjectService, ProjectRepository)
- **Task Module**: Управление задачами (TaskController, TaskService, TaskRepository)
- **Chat Module**: Сообщения и WebSocket (ChatController, WebSocketConfig, MessageService)
- **File Module**: Загрузка/выгрузка файлов (FileController, FileStorageService)
- **Admin Module**: Административная панель (AdminController, AdminService)
- **Analytics Module**: Статистика и аналитика (AnalyticsController, AnalyticsService)
- **Common Module**: Общие компоненты (DTOs, Exceptions, Configurations, Security)

## 4. Структура базы данных

### Основные сущности

#### Users (Пользователи)
- id (UUID, PK)
- email (String, Unique)
- password (String, Hashed)
- username (String)
- firstName (String)
- lastName (String)
- avatar (String, URL)
- role (Enum: USER, ADMIN)
- isActive (Boolean)
- createdAt (DateTime)
- updatedAt (DateTime)

#### Teams (Команды)
- id (UUID, PK)
- name (String)
- description (String, Optional)
- avatar (String, URL, Optional)
- ownerId (UUID, FK -> Users)
- createdAt (DateTime)
- updatedAt (DateTime)

#### TeamMembers (Участники команд)
- id (UUID, PK)
- teamId (UUID, FK -> Teams)
- userId (UUID, FK -> Users)
- role (Enum: MEMBER, ADMIN)
- joinedAt (DateTime)

#### Projects (Проекты)
- id (UUID, PK)
- name (String)
- description (String, Optional)
- teamId (UUID, FK -> Teams)
- status (Enum: ACTIVE, ARCHIVED, COMPLETED)
- createdAt (DateTime)
- updatedAt (DateTime)

#### Tasks (Задачи)
- id (UUID, PK)
- title (String)
- description (Text, Optional)
- projectId (UUID, FK -> Projects)
- assigneeId (UUID, FK -> Users, Optional)
- creatorId (UUID, FK -> Users)
- status (Enum: TODO, IN_PROGRESS, IN_REVIEW, DONE, BLOCKED)
- priority (Enum: LOW, MEDIUM, HIGH, URGENT)
- dueDate (DateTime, Optional)
- createdAt (DateTime)
- updatedAt (DateTime)

#### TaskComments (Комментарии к задачам)
- id (UUID, PK)
- taskId (UUID, FK -> Tasks)
- userId (UUID, FK -> Users)
- content (Text)
- createdAt (DateTime)
- updatedAt (DateTime)

#### Messages (Сообщения)
- id (UUID, PK)
- chatId (UUID, FK -> Chats)
- senderId (UUID, FK -> Users)
- content (Text)
- type (Enum: TEXT, FILE, IMAGE)
- fileUrl (String, Optional)
- createdAt (DateTime)
- updatedAt (DateTime)

#### Chats (Чаты)
- id (UUID, PK)
- type (Enum: DIRECT, GROUP, CHANNEL)
- name (String, Optional)
- teamId (UUID, FK -> Teams, Optional)
- projectId (UUID, FK -> Projects, Optional)
- createdAt (DateTime)
- updatedAt (DateTime)

#### ChatMembers (Участники чатов)
- id (UUID, PK)
- chatId (UUID, FK -> Chats)
- userId (UUID, FK -> Users)
- joinedAt (DateTime)
- lastReadAt (DateTime, Optional)

#### Files (Файлы)
- id (UUID, PK)
- filename (String)
- originalName (String)
- mimeType (String)
- size (Integer)
- url (String)
- uploadedBy (UUID, FK -> Users)
- taskId (UUID, FK -> Tasks, Optional)
- messageId (UUID, FK -> Messages, Optional)
- createdAt (DateTime)

## 5. API Endpoints

### 5.1 Authentication
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `POST /api/auth/refresh` - Обновление токена
- `POST /api/auth/logout` - Выход
- `GET /api/auth/me` - Получение текущего пользователя

### 5.2 Users
- `GET /api/users` - Список пользователей (с пагинацией)
- `GET /api/users/:id` - Профиль пользователя
- `PUT /api/users/:id` - Обновление профиля
- `PUT /api/users/:id/avatar` - Загрузка аватара

### 5.3 Teams
- `GET /api/teams` - Список команд пользователя
- `POST /api/teams` - Создание команды
- `GET /api/teams/:id` - Информация о команде
- `PUT /api/teams/:id` - Обновление команды
- `DELETE /api/teams/:id` - Удаление команды
- `POST /api/teams/:id/members` - Приглашение участника
- `DELETE /api/teams/:id/members/:userId` - Удаление участника
- `GET /api/teams/:id/members` - Список участников

### 5.4 Projects
- `GET /api/teams/:teamId/projects` - Список проектов команды
- `POST /api/teams/:teamId/projects` - Создание проекта
- `GET /api/projects/:id` - Информация о проекте
- `PUT /api/projects/:id` - Обновление проекта
- `DELETE /api/projects/:id` - Удаление проекта

### 5.5 Tasks
- `GET /api/projects/:projectId/tasks` - Список задач проекта
- `POST /api/projects/:projectId/tasks` - Создание задачи
- `GET /api/tasks/:id` - Информация о задаче
- `PUT /api/tasks/:id` - Обновление задачи
- `DELETE /api/tasks/:id` - Удаление задачи
- `PUT /api/tasks/:id/assign` - Назначение исполнителя
- `PUT /api/tasks/:id/status` - Изменение статуса

### 5.6 Task Comments
- `GET /api/tasks/:taskId/comments` - Комментарии задачи
- `POST /api/tasks/:taskId/comments` - Добавление комментария
- `PUT /api/comments/:id` - Редактирование комментария
- `DELETE /api/comments/:id` - Удаление комментария

### 5.7 Chats
- `GET /api/chats` - Список чатов пользователя
- `POST /api/chats` - Создание чата
- `GET /api/chats/:id` - Информация о чате
- `GET /api/chats/:id/messages` - Сообщения чата
- `POST /api/chats/:id/members` - Добавление участника

### 5.8 Files
- `POST /api/files/upload` - Загрузка файла
- `GET /api/files/:id` - Получение файла
- `DELETE /api/files/:id` - Удаление файла

### 5.9 Admin
- `GET /api/admin/users` - Управление пользователями
- `GET /api/admin/teams` - Управление командами
- `GET /api/admin/statistics` - Статистика системы
- `GET /api/admin/activity` - Активность пользователей

## 6. WebSocket Events (STOMP)

### 6.1 События чата
- `/app/chat.send` - Отправка сообщения (клиент -> сервер)
- `/topic/chat.{chatId}` - Получение сообщения (сервер -> клиент)
- `/app/chat.typing` - Индикатор набора текста (клиент -> сервер)
- `/topic/chat.{chatId}.typing` - Уведомление о наборе текста (сервер -> клиент)
- `/app/chat.read` - Отметка о прочтении (клиент -> сервер)
- `/topic/chat.{chatId}.read` - Уведомление о прочтении (сервер -> клиент)
- `/app/chat.join` - Присоединение к чату (клиент -> сервер)
- `/app/chat.leave` - Выход из чата (клиент -> сервер)
- `/topic/chat.{chatId}.members` - Изменения в участниках (сервер -> клиент)

### 6.2 События задач
- `/topic/task.{projectId}.created` - Создание задачи
- `/topic/task.{projectId}.updated` - Обновление задачи
- `/topic/task.{projectId}.status_changed` - Изменение статуса
- `/topic/task.{projectId}.assigned` - Назначение исполнителя
- `/topic/task.{taskId}.comment_added` - Добавление комментария

### 6.3 События проектов
- `/topic/project.{teamId}.created` - Создание проекта
- `/topic/project.{teamId}.updated` - Обновление проекта

### 6.4 Технические детали
- **Протокол**: STOMP over WebSocket
- **Брокер**: Встроенный SimpleBroker или внешний (RabbitMQ, ActiveMQ)
- **Аутентификация**: JWT токен в заголовках STOMP
- **Подписки**: Динамические подписки на каналы по ID чатов/проектов

## 7. UI/UX Спецификация

### 7.1 Цветовая палитра
- **Фон основной**: #0A0A0A (почти чёрный)
- **Фон карточек**: #151515 (тёмно-серый)
- **Фон панелей**: #1A1A1A (графитовый)
- **Акцентный цвет**: #00D9FF (холодный голубой)
- **Акцентный цвет (hover)**: #00B8D9
- **Текст основной**: #E0E0E0
- **Текст вторичный**: #A0A0A0
- **Границы**: #2A2A2A
- **Успех**: #00FF88
- **Ошибка**: #FF4444
- **Предупреждение**: #FFAA00

### 7.2 Типографика
- **Заголовки**: Inter / Roboto, Bold
- **Основной текст**: Inter / Roboto, Regular
- **Моноширинный**: JetBrains Mono (для кода)

### 7.3 Компоненты интерфейса

#### Основные компоненты
- **Header**: Навигация, уведомления, профиль
- **Sidebar**: Меню команд, проектов, чатов
- **Main Content Area**: Рабочая область
- **Task Card**: Карточка задачи с градиентной рамкой
- **Chat Message**: Сообщение с аватаром и временем
- **User Avatar**: Круглый аватар с градиентной рамкой
- **Status Badge**: Бейдж статуса с неоновым свечением
- **Modal/Dialog**: Модальные окна с затемнением
- **Input Fields**: Поля ввода с подсветкой при фокусе
- **Buttons**: Кнопки с градиентным эффектом при hover

#### Анимации
- Плавное появление элементов (fade-in)
- Плавные переходы состояний (transition)
- Неоновое свечение при hover на интерактивных элементах
- Плавная прокрутка списков
- Анимация уведомлений (slide-in)

## 8. Этапы разработки

### Этап 1: Базовая инфраструктура (1-2 недели)
- [ ] Настройка Next.js проекта (TypeScript, Tailwind CSS)
- [ ] Настройка Spring Boot проекта (Maven/Gradle)
- [ ] Настройка базы данных PostgreSQL
- [ ] Настройка Spring Data JPA
- [ ] Настройка Flyway/Liquibase для миграций
- [ ] Базовая структура папок (Frontend + Backend)
- [ ] Настройка Docker окружения
- [ ] Настройка CI/CD
- [ ] Базовая конфигурация TypeScript, ESLint, Prettier
- [ ] Настройка application.properties/yml для разных окружений

### Этап 2: Аутентификация и пользователи (1 неделя)
- [ ] Entity User (JPA)
- [ ] UserRepository (Spring Data JPA)
- [ ] UserService и UserController
- [ ] Настройка Spring Security
- [ ] JWT токены (access + refresh) - JwtTokenProvider
- [ ] Security Filter Chain
- [ ] API регистрации и авторизации
- [ ] Frontend: страницы Login/Register (Next.js App Router)
- [ ] Frontend: защищённые роуты (middleware Next.js)
- [ ] Профиль пользователя
- [ ] PasswordEncoder (BCrypt)

### Этап 3: Команды (1 неделя)
- [ ] Entities Team, TeamMember (JPA)
- [ ] TeamRepository и TeamMemberRepository
- [ ] TeamService и TeamController
- [ ] API управления командами (REST)
- [ ] Приглашение участников
- [ ] Frontend: создание команды (Next.js)
- [ ] Frontend: список команд
- [ ] Frontend: страница команды
- [ ] Управление участниками

### Этап 4: Проекты (1 неделя)
- [ ] Entity Project (JPA)
- [ ] ProjectRepository
- [ ] ProjectService и ProjectController
- [ ] API управления проектами (REST)
- [ ] Frontend: создание проекта (Next.js)
- [ ] Frontend: список проектов
- [ ] Frontend: страница проекта
- [ ] Связь проектов с командами

### Этап 5: Задачи (2 недели)
- [ ] Entities Task, TaskComment (JPA)
- [ ] TaskRepository и TaskCommentRepository
- [ ] TaskService и TaskController
- [ ] API управления задачами (REST)
- [ ] Назначение исполнителей
- [ ] Изменение статусов
- [ ] Frontend: создание задачи (Next.js)
- [ ] Frontend: карточка задачи
- [ ] Frontend: список задач (Kanban/List)
- [ ] Frontend: комментарии к задачам
- [ ] Фильтры и сортировка задач

### Этап 6: Чаты (2 недели)
- [ ] Entities Chat, Message, ChatMember (JPA)
- [ ] Repositories для чатов
- [ ] Настройка Spring WebSocket (STOMP)
- [ ] WebSocketConfig и MessageController
- [ ] WebSocket сервер (события чата)
- [ ] API управления чатами (REST)
- [ ] Frontend: WebSocket клиент (STOMP.js / Socket.io-client)
- [ ] Frontend: список чатов
- [ ] Frontend: интерфейс чата
- [ ] Личные сообщения
- [ ] Групповые чаты
- [ ] Каналы по проектам
- [ ] Индикатор набора текста
- [ ] Отметки о прочтении

### Этап 7: Файлы (1 неделя) - Опционально
- [ ] Entity File (JPA)
- [ ] FileRepository
- [ ] FileService и FileController
- [ ] API загрузки файлов (MultipartFile)
- [ ] Хранилище файлов (S3 или локальное)
- [ ] Frontend: компонент загрузки (Next.js)
- [ ] Прикрепление файлов к задачам
- [ ] Прикрепление файлов к сообщениям
- [ ] Просмотр и скачивание файлов

### Этап 8: Административная панель (1-2 недели)
- [ ] Роли пользователей (ADMIN)
- [ ] API администратора
- [ ] Frontend: админ-панель
- [ ] Управление пользователями
- [ ] Управление командами
- [ ] Просмотр статистики
- [ ] Логи активности

### Этап 9: Статистика и аналитика (1 неделя) - Опционально
- [ ] API статистики
- [ ] Графики прогресса команд
- [ ] Статистика по задачам
- [ ] Активность участников
- [ ] Frontend: дашборд со статистикой
- [ ] Экспорт данных

### Этап 10: Звонки (2-3 недели) - Опционально
- [ ] Интеграция WebRTC
- [ ] Сигнальный сервер
- [ ] Frontend: компонент звонков
- [ ] Групповые звонки
- [ ] Управление звонками

### Этап 11: Полировка и оптимизация (1-2 недели)
- [ ] Оптимизация производительности
- [ ] Обработка ошибок
- [ ] Валидация данных
- [ ] Тестирование (Unit + E2E)
- [ ] Адаптивность (мобильная версия)
- [ ] SEO оптимизация
- [ ] Документация API
- [ ] Документация для разработчиков

## 9. Структура проекта

### Frontend структура (Next.js App Router)
```
frontend/
├── app/                     # Next.js App Router
│   ├── (auth)/              # Route groups
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/         # Защищённые роуты
│   │   ├── teams/
│   │   ├── projects/
│   │   ├── tasks/
│   │   ├── chat/
│   │   └── admin/
│   ├── api/                 # API Routes (если нужны)
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Главная страница
│   └── globals.css          # Глобальные стили
├── components/              # Переиспользуемые компоненты
│   ├── ui/                  # Базовые UI компоненты (Shadcn)
│   ├── layout/              # Компоненты макета
│   ├── task/                # Компоненты задач
│   ├── chat/                # Компоненты чата
│   └── common/              # Общие компоненты
├── lib/                     # Утилиты и конфигурации
│   ├── api/                 # API клиент
│   ├── websocket/           # WebSocket клиент
│   ├── utils/               # Утилиты
│   └── constants/           # Константы
├── store/                   # State management (Zustand)
├── hooks/                   # Custom hooks
├── types/                   # TypeScript типы
├── public/                  # Статические файлы
├── middleware.ts            # Next.js middleware
├── tailwind.config.ts       # Tailwind конфигурация
├── tsconfig.json
└── package.json
```

### Backend структура (Spring Boot)
```
backend/
├── src/
│   └── main/
│       ├── java/
│       │   └── com/kompot/
│       │       ├── KompotApplication.java    # Главный класс
│       │       ├── config/                   # Конфигурации
│       │       │   ├── SecurityConfig.java
│       │       │   ├── WebSocketConfig.java
│       │       │   ├── JwtConfig.java
│       │       │   └── CorsConfig.java
│       │       ├── controller/               # REST Controllers
│       │       │   ├── AuthController.java
│       │       │   ├── UserController.java
│       │       │   ├── TeamController.java
│       │       │   ├── ProjectController.java
│       │       │   ├── TaskController.java
│       │       │   ├── ChatController.java
│       │       │   ├── FileController.java
│       │       │   └── AdminController.java
│       │       ├── service/                  # Business Logic
│       │       │   ├── AuthService.java
│       │       │   ├── UserService.java
│       │       │   ├── TeamService.java
│       │       │   ├── ProjectService.java
│       │       │   ├── TaskService.java
│       │       │   ├── ChatService.java
│       │       │   ├── FileService.java
│       │       │   └── AdminService.java
│       │       ├── repository/               # Data Access (JPA)
│       │       │   ├── UserRepository.java
│       │       │   ├── TeamRepository.java
│       │       │   ├── ProjectRepository.java
│       │       │   ├── TaskRepository.java
│       │       │   ├── ChatRepository.java
│       │       │   └── MessageRepository.java
│       │       ├── model/                    # Entities
│       │       │   ├── User.java
│       │       │   ├── Team.java
│       │       │   ├── Project.java
│       │       │   ├── Task.java
│       │       │   ├── Chat.java
│       │       │   └── Message.java
│       │       ├── dto/                      # Data Transfer Objects
│       │       │   ├── request/
│       │       │   └── response/
│       │       ├── security/                 # Security
│       │       │   ├── JwtTokenProvider.java
│       │       │   ├── JwtAuthenticationFilter.java
│       │       │   └── UserDetailsServiceImpl.java
│       │       ├── exception/                # Exception Handling
│       │       │   ├── GlobalExceptionHandler.java
│       │       │   └── CustomException.java
│       │       └── websocket/                # WebSocket Handlers
│       │           └── ChatWebSocketHandler.java
│       └── resources/
│           ├── application.properties        # Конфигурация
│           ├── application-dev.properties
│           ├── application-prod.properties
│           └── db/migration/                 # Flyway миграции
│               └── V1__Initial_schema.sql
├── src/test/                                 # Тесты
│   └── java/
│       └── com/kompot/
├── pom.xml                                   # Maven (или build.gradle)
└── Dockerfile
```

## 10. Безопасность

### Меры безопасности
- [ ] Хеширование паролей (BCryptPasswordEncoder)
- [ ] JWT токены с коротким временем жизни
- [ ] Refresh токены в httpOnly cookies
- [ ] Spring Security конфигурация
- [ ] Валидация всех входных данных (Bean Validation)
- [ ] Защита от SQL инъекций (JPA/Hibernate)
- [ ] CORS настройка (CorsConfig)
- [ ] Rate limiting (Spring Boot Starter Resilience4j)
- [ ] Защита от XSS
- [ ] Защита от CSRF (Spring Security CSRF)
- [ ] Шифрование чувствительных данных
- [ ] Логирование подозрительной активности (SLF4J + Logback)
- [ ] Method-level security (@PreAuthorize)
- [ ] Input sanitization

## 11. Тестирование

### Типы тестов

#### Backend (Spring Boot)
- **Unit тесты**: JUnit 5 для сервисов и утилит (Mockito)
- **Integration тесты**: @SpringBootTest для полного контекста
- **Web Layer тесты**: MockMvc для тестирования контроллеров
- **Repository тесты**: @DataJpaTest для тестирования репозиториев
- **WebSocket тесты**: Тестирование STOMP endpoints

#### Frontend (Next.js)
- **Unit тесты**: Jest + React Testing Library для компонентов
- **Integration тесты**: Тестирование страниц и взаимодействий
- **E2E тесты**: Playwright / Cypress для критических сценариев

### Покрытие
- Минимальное покрытие: 70%
- Критичные модули: 90%+
- Использование JaCoCo для измерения покрытия (Backend)

## 12. Деплой и DevOps

### Окружения
- **Development**: Локальная разработка
- **Staging**: Тестовое окружение
- **Production**: Продакшн

### CI/CD Pipeline
1. Линтинг и проверка типов
2. Запуск тестов
3. Сборка приложения
4. Деплой на staging
5. Автоматические тесты на staging
6. Ручное подтверждение для production
7. Деплой на production

## 13. Документация

### Необходимая документация
- [ ] README с инструкциями по запуску
- [ ] API документация (Springdoc OpenAPI / Swagger UI)
- [ ] Документация компонентов (Storybook для Next.js)
- [ ] Руководство по развёртыванию
- [ ] Гайд для разработчиков
- [ ] JavaDoc для Backend кода
- [ ] Changelog

## 14. Метрики и мониторинг

### Отслеживаемые метрики
- Время отклика API
- Количество активных пользователей
- Количество сообщений в секунду
- Ошибки и исключения
- Использование ресурсов сервера
- Производительность базы данных

## 15. Будущие улучшения

### Возможные расширения
- Мобильное приложение (React Native)
- Интеграция с внешними сервисами (GitHub, Jira)
- Расширенная аналитика и отчёты
- Система уведомлений (email, push)
- Календарь и планирование
- Голосовые сообщения
- Видео-звонки с записью
- Интеграция с календарём
- Экспорт данных в различные форматы

---

## Примечания

- Этапы, помеченные как "Опционально", могут быть реализованы в зависимости от приоритетов
- Временные оценки являются приблизительными и могут варьироваться
- План может корректироваться в процессе разработки
- Приоритет: сначала реализовать основной функционал (этапы 1-6), затем опциональные возможности

