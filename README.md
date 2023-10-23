# Table of Contents
1. [Introduction](#introduction)
2. [Setup](#setup)
   1. [First create a new Nest application](#first-create-a-new-nest-application)
   2. [Database Container](#database-container)
   3. [Prisma](#prisma)
   4. [Set up the database schema](#set-up-the-database-schema)
   5. [Prisma module](#prisma-module)
3. [Before Authentication](#before-authentication)
   1. [NestJs Request Lifecycle](#nestjs-request-lifecycle)
      - [Middlewares](#middlewares)
      - [Guards](#guards)
      - [Interceptors](#interceptors)
      - [Pipes](#pipes)
      - [Handlers](#handlers)
      - [Exception Filters](#exception-filters)
4. [Authentication](#authentication)


# NestJs Authentication System With 42-Intra

# Introduction

This is not a NestJS tutorial, I assume you already have Nest and Nest cli installed in your machine and you’re somewhat familiar with the framework’s core concepts so let’s get into it.

# Setup

### First create a new nest application

```jsx
nest new NestAuthSystem
```

Now we need a database, in order to store our authenticated users’s data. so let’s get that out of the way:

### Database Container

assuming you have installed docker and you’re familiar with basic docker commands, create a new docker compose file and add the database service to it:

```docker
services:
  database:
    image: postgres:latest
    container_name: postgres
    ports:
      - 5434:5432
    env_file: .env
    restart: on-failure
```

You can add a volume if you want your database to be persistent. Now run the database with the following command

```docker
docker compose up -d
```

### Prisma

we have our database up and running but we need an ORM (Object-Relational Mapping) so that we can interact with our database easily without having to write sql queries. We will be using Prisma for this project. We first need to install it, I will do so using npm but feel free to use any package manager you want

```docker
npm install prisma --save-dev
```

Next, we will run the Prisma CLI because we will need it later

```docker
npx prisma
```

Now we’ll create an initial Prisma setup using the Prisma CLI 

```docker
npx prisma init
```

this command generates:

- A new Prisma directory that contains a file schema.prisma that will hold our database schema
- An `.env` file with the DATABASE_URL variable in it, or if the `.env` file already exists in the root directory of our app, prisma just appends the variable to it. This variable should be modified to match our database credentials (db name, user and password)

### Set up the database schema:

We will just create a basic Model for our User for this guide, you can add more data to it later but for now it’ll only have a username and an email field.

So basically our schema.prisma file should look like this: 

```jsx
// Generates a prisma client that we'll use to interact with the database from our app
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// This is our user model
model User {
	id  Int @id @default(autoincrement())
  email      String @unique
  username   String @unique
}
```

At this point, you have a Prisma schema but no database yet. Run the following command th database and the **`User`** table represented by your model

```jsx
npx prisma migrate dev --name init
```

This command creates a new SQL migration file for this migration in the **`prisma/migrations`**  directory and creates the actual tables in our contained database.

Another thing if you want an interface to manage your database run the command

```jsx
npx prisma studio
```

it will open a tab in the browser where you’ll be able to view and edit the data in your database.

### Prisma module:

Now that we have our database running and our ORM ready. We need to link it this to our Nestjs backend so that we can save our users’s data into the database using prisma client. First of all let’s install the prisma client

```jsx
$ npm install @prisma/client
```

Note that during installation, Prisma automatically invokes the `prisma generate` command for you. In the future, you need to run this command after *every* change to your Prisma models to update your generated Prisma Client.

Now that our prisma client is ready, let’s create our prisma module. The following commands will generate the necessary files and include them in the app module

```jsx
nest generate module prisma --no-spec
nest generate service prisma --no-spec
```

Now we’ll head to the service file and create a new class that extends the `PrismaClient` class. In the constructor,  we’ll call the `PrismaClient` constructor (super) and pass the an object to it that holds our database url. But there’s a catch, the url is in the .env file a we need a way to retrieve it. ConfigService is what we need here so go ahead and install it 

```jsx
npm install @nestjs/config
```

now add it into the imports of the app module 

```jsx
// isGlobal means that the config module will be available globally in the app so that we don't have to import it everytime
imports: [ConfigModule.forRoot({ isGlobal: true })],
```

and inject it into the prisma service by instantiating it in the constructor. This is what the prisma service should look like now

```jsx
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(private configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get('DATABASE_URL'),
        },
      },
    });
  }
}
```

now add a Global decorator to the prisma module in order to make it available globally as well and add the PrismaService to the exports array so that it’s accessible by other modules.

```jsx
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

Now we have all we need in order to start authenticating users. Let’s go!

# Before Authentication

Before we dive into the implementation of our authentication system, let’s talk about the request lifecycle in NestJS. Understanding this will help you determine where to write a particular code to get the desired behavior which would be helpful in our auth system implementation.

## NestJs Request Lifecycle

In a nutshell, a request goes through the middlewares to the guards, interceptors, pipes, the route handler’s and finally to the interceptors in the return path (when the response is generated). If an error occurs, the exception filters are executed. Check out this diagram to get a better understanding of the differences and similarities of these stages.

![Diagram](https://i.stack.imgur.com/2lFhd.jpg)

source: https://stackoverflow.com/questions/54863655/whats-the-difference-between-interceptor-vs-middleware-vs-filter-in-nest-js

That was the high-level flow so let’s take a step back and tackle each step on it’s own.

### Middlewares

This is the first stop that a request hits. **Middlewares** play a crucial role in the NestJS request lifecycle. Middlewares are useful if you want to mutate the request object, for example you can attach some properties to it that you might need later to handle the request.

Middlewares can be global-scoped or module scoped, meaning you can chose if you want a middleware to be applied to all the routes (global), or just for specific routes (module)

NestJS provides a wide range of built-in middlewares that handle common tasks like parsing request bodies, dealing with `CORS` (Cross-Origin Resource Sharing), and more. Typically, these built-in middlewares execute early in the middleware pipeline, followed by global middlewares and then module middlewares. 

In addition to built-in and custom middlewares, third-party middlewares are also available. For example, the **`cookie-parser`** middleware is widely used in NestJS applications for working with cookies.

Custom middlewares are an implementation of the builtin interface `NestMiddleware` and allow you to inject your own logic into the request pipeline, making them a powerful tool for handling various aspects of incoming requests.

### Guards

After going through the middleware, the request proceeds to the guards. Guards are responsible for determining the validity of a request based on authorization criteria. They implement the built-in **`CanActivate`** interface, which defines a function of the same name. This function takes **`ExecutionContext`** as an argument. **`ExecutionContext`** is a utility class that offers information about the current execution context, including request and response objects. Similar to middlewares, guards can be global scoped, route scoped, or controller scoped. The execution order for guards is as follows: global guards run first, followed by controller guards, and finally, route guards.

### Interceptors

Now the request has reached the Interceptor. Interceptors are the most powerful form of the request-response pipeline because we have access to the request object before it hits the handler and the response after it’s gone through the handler. Here we can do things like global error handling, mutating the response and more.

Interfaces are also an implementation of a builtin interface `NestInterface`. Here’s a quick example:

```jsx
@Injectable()
export class MyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    console.log('I Am Running Before...');

    return next
      .handle()
      .pipe(
        tap(() => console.log('I Am Running After...')),
				map(result => ({ transformedResult: result })),
        catchError(err => throwError(() => new BadGatewayException())),
      );
  }
}
```

The **`CallHandler`** represents the next element in the chain of handlers for a request. It's essentially a reference to the next step in the request-response cycle, which can be another interceptor or the final handler (controller method) that will process the request.

The code before `handle()` runs before the route handler method, which means this is where we have access to the request, and any code that runs after the `handler()` method, is where we have access to the response, we can mutate it if we need to before it goes back to the client.

Like guards, interceptors can be controller-scoped, route-scoped or global-scoped and they run in the same order as guards but they run in the reverse order when the response if sent (after the route handler is executed).

### Pipes

Pipes are the last stop for a request before it finally reaches the route handler method. They essentially just transform input data that’s going to the handler into any desired form OR validate it in case it doesn’t conform to a certain standard like JSON schema.

Also like guards and interceptors, pipes can be controller-scoped, route-scoped or global-scoped and they can also be Route-Parameter scoped, meaning they they only work on a certain parameter of the route handler method. They run in the same order as guards with the Route-Parameter pipes running last.

### Handlers

Finally the request hits the handler, which is basically the method that executes whatever the request was sent for and sends back the response.

### Exception Filters

Filters are basically a catch block around our whole request response pipeline, responsible for processing all unhandled exceptions across the app.

Filters are only executed if any uncaught exception occurs during the request process. Caught exceptions, such as those caught with a `try/catch` will not trigger Exception Filters. As soon as an uncaught exception is encountered, the rest of the lifecycle is ignored and the request skips straight to the filter.

Filters are the only component that do not resolve global first. Instead, route bound filters resolve first and proceeding next to controller filters, and finally to global filters.

Note that exceptions cannot be passed from filter to filter so if a route filter catches the exception, a controller or global filter cannot catch the same exception.

And with that, I hope you now have a good understanding of the request lifecycle in NestJs, I encourage you to look up each part alone and learn as much as possible. you can refer to the official documentation for that

# **Authentication**

Authentication is a critical aspect of modern web applications, ensuring that users are who they claim to be and protecting sensitive data from unauthorized access. It's the gatekeeper that allows or denies access to various parts of your application based on user identity. In the context of web development, authentication typically involves validating a user's credentials, such as a username and password or, in our case, using a third-party authentication provider like 42.

Note: In my implementation I made a user/password login option along with intra auth, but In this guide I’ll only cover the intra auth with passport-42 since that is what’s requested by the subject.

Run the following command to install the necessary packages:

```jsx
npm install passport-42 && npm install @nestjs/passport passport
```

This should install everything we need. Now go to the `main.ts` file, import passport 

```jsx
import * as passport from 'passport';
```

and add the following line:

```jsx
app.use(passport.initialize())
```

under the app declaration. This line initializes Passport for incoming requests, allowing authentication strategies to be applied, don’t worry we’ll cover strategies shortly.

Now we need to create an Auth module. Open the terminal and run the following command:

```jsx
nest generate resource Auth --no-spec
// you will be prompted to choose a transport layer, pick RestAPI
// you will be asked if you need CRUD entry points, the answer is no
```

this will generate the necessary files for our auth system. The `Service` file holds the authentication logic, and the `Controller` file is used to expose the authentication endpoints.

In the controller, we will create the 42auth and 42-redirect routes. for now It should look like this:

```jsx
import { Controller, Get } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  constructor() {}

  @Get('42')
  auth42() {}

  @Get('42-redirect')
  auth42Redirect() {}
}
```

you might see that nothing special is going on yet, the routes are there but there is no logic to execute.

That’s because we will only need a Guard to validate the request and a Strategy (what’s that?)  to handle the data that we will get back from the 42API, everything in between is handled by authentication library `passport`

Before we get into it, add the passport module to the auth guard’s imports array and give it the following option `{ session: false }`. This option indicates that the Passport configuration should not use session-based authentication because we won’t be using sessions.

For this to work, we will need the **`AuthGuard`** from `@nestjs/passport` . it’s s a built-in guard in NestJS that simplifies the process of applying authentication to routes. It is a part of the Passport module. It’s configured with a specific Passport strategy, and it delegates the actual authentication logic to that strategy. The strategy and guard are linked together with a key which is a string parameter that is passed to both (`AuthGuard` and `PassportStrategy` which we will cover in a bit)

In a new file:

- define a custom guard **`FTAuthGuard`** that extends **`AuthGuard` (**you’ll need to import it ) with a string parameter that will serve as a key which will link our guard and strategy together
- call the parent class’ `canActivate` function `asynchronically` with the `super` keyword and pass to it the provided context, it will return a boolean that indicates whether or not the current request is allowed to proceed
- retrieve the request object from the `ExecutionContext` argument of our `canActivate` method and pass it to the parent class’ `logIn()` method (again with the `super` keyword), this method is used to perform the login process to the 42API
- finally we return  whatever the `canActivate` method returned earlier, and only if it’s true, the request will proceed and move on to the `strategy`.

The guard should look like this:

```jsx
import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class FTAuthGuard extends AuthGuard('42') {
  async canActivate(context: ExecutionContext) {
    try {
      const activate = (await super.canActivate(context)) as boolean;
      const request = context.switchToHttp().getRequest();
      await super.logIn(request);
      return activate;
    } catch (error) {
      console.log(error);
    }
  }
}
```

So, you already know what is a guard but what about `Strategy`? Well, strategies are responsible for the actual authentication logic. They define how authentication should be performed for a specific method or provider. Strategies can be reused across multiple guards. For example, you can have different guards that use the same Passport strategy for authentication.

In a new file:

- define a custom strategy (I named it `FTStrategy`) that extends `PassportStrategy` (don’t forget to import it) with a string parameter that will serve as a key which will link our guard and strategy together. Note that `PassportStrategy` is actually a function that return a class, and that class is what we’re extending.
- import `Strategy` and `Profile` classes from `passport-42` package and pass them as input for the `PassportStrategy` function.
- Setup a constructor and within that constructor call the super class’ constructor using the `super` method, then pass it the OAuth client properties (42 in our case). So pass in the `client_id`, `client_secret` (you can get those from intra) `callbackURL` (the url to which the 42API will redirect the user after getting authenticated) and the scope (the scope parameter is used to specify the permissions or access rights that the application is requesting from 42API)
    
    ```jsx
    // config is the instance of ConfigService that is injected into our strategy class
    super({
          clientID: config.get('42_UID'),
          clientSecret: config.get('42_SECRET'),
          callbackURL: config.get('42_CALLBACK_URI'),
          Scope: ['profile'],
        });
    ```
    
    now when the user successfully authenticates itself, a method called `validate()` is expected and will be automatically invoked so we need to define it.
    
- define the method as follows:
    
    ```jsx
    async validate(accessToken: string, refreshToken: string, profile: Profile)
    ```
    
- accessToken: This is an access token obtained from the 42API after a user successfully logs in. The access token is a credential that allows the application to access the user's resources on the OAuth provider's platform, as authorized by the user, without asking him to authorize the app every time. refreshToken is used to regenerate the accessToken when it expires
- the profile parameter is an object that contains all the requested user-data such as name, email, profile picture link and more.. the type for this parameter is `Profile` which should be imported from the `passport-42` package
- For now just log the data to make sure you got all the that you need and figure out how to handle it later
- Now that you’ve got your user’s data, check if it already exists in the database (meaning he’s already registered to the app) and return it
    
    ```jsx
    const user = await this.prisma.user.findFirst({
          where: {
            email: profile.email,
          },
        });
    // I use the email as the user's ID but you can use whatever you want as long as you make sure it unique to each user 
    ```
    
- If the `user` is null, meaning he’s not on the database, add him and then return him
    
    ```jsx
    await this.prisma.user.create({
            data: {
              email: dto.email,
              username: dto.username,
              hash: hash,
              avatarLink: dto.avatar,
              isAuthenticated: false,
            },
          });
    ```
    

Now the strategy file should look like this:

```jsx
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-42';
import { AuthService } from './auth.service';

@Injectable()
export class FTStrategy extends PassportStrategy(Strategy, '42') {
  constructor(
    private config: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: config.get('42_UID'),
      clientSecret: config.get('42_SECRET'),
      callbackURL: config.get('42_CALLBACK_URI'),
      Scope: ['profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    let user = await this.prisma.user.findFirst({
      where: {
        username: profile.username,
      },
    });
    if (!user) {
			await this.prisma.user.create({
        data: {
          email: dto.email,
          username: dto.username,
          hash: hash,
          avatarLink: dto.avatar,
          isAuthenticated: false,
        },
      });
      user = await this.authService.findUser(profile.emails[0].value);
    }
    return user;
  }

}
```

Now we need to add the guard that will invoke the `FTStrategy` to our controller, for that we will use the `@UseGuards()` decorator and pass the `FTAuthGuard` to it

```jsx
import {
  Controller,
  Get,
  HttpCode,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor() {}

	@UseGuards(FTAuthGuard)
  @Get('42')
  auth42() {}

	@UseGuards(FTAuthGuard)
  @Get('42-redirect')
  auth42Redirect(@Req() req) {
		return { msg: req.user.username + " You have successfully logged in" };
	}
}
```

Finally after importing all the necessary modules to your auth module, it should look like this:
 

```jsx
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthGuard } from 'src/guards/auth.jwt.guard';
import { FTStrategy } from './42.strategy';
import { FTAuthGuard } from 'src/guards/auth.42.guard';
import { PassportModule } from '@nestjs/passport'

@Module({
  imports: [
    PassportModule.register({ session: false }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    FTAuthGuard,
    FTStrategy,
  ],
})
export class AuthModule {}
```

That’s it, you have now authenticated the user and added him to the database. He’s in the game.
