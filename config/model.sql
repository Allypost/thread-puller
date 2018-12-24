create database "thread-puller";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

create table if not exists users
(
  id         serial                   not null,
  username   varchar(255)             not null,
  email      varchar(255)             not null,
  created_at timestamp with time zone not null,
  updated_at timestamp with time zone,
  deleted_at timestamp with time zone,
  password   varchar(255)             not null,
  constraint users_pk
    primary key (id)
);

create unique index if not exists users_email_uindex
  on users (email);

create unique index if not exists users_uid_uindex
  on users (id);


