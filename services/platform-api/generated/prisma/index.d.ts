
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model LlmProvider
 * 
 */
export type LlmProvider = $Result.DefaultSelection<Prisma.$LlmProviderPayload>
/**
 * Model LlmModel
 * 
 */
export type LlmModel = $Result.DefaultSelection<Prisma.$LlmModelPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const UserStatus: {
  ACTIVE: 'ACTIVE',
  DISABLED: 'DISABLED'
};

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus]


export const UserRole: {
  ADMIN: 'ADMIN',
  USER: 'USER'
};

export type UserRole = (typeof UserRole)[keyof typeof UserRole]

}

export type UserStatus = $Enums.UserStatus

export const UserStatus: typeof $Enums.UserStatus

export type UserRole = $Enums.UserRole

export const UserRole: typeof $Enums.UserRole

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.llmProvider`: Exposes CRUD operations for the **LlmProvider** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more LlmProviders
    * const llmProviders = await prisma.llmProvider.findMany()
    * ```
    */
  get llmProvider(): Prisma.LlmProviderDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.llmModel`: Exposes CRUD operations for the **LlmModel** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more LlmModels
    * const llmModels = await prisma.llmModel.findMany()
    * ```
    */
  get llmModel(): Prisma.LlmModelDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.19.3
   * Query Engine version: c2990dca591cba766e3b7ef5d9e8a84796e47ab7
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    User: 'User',
    LlmProvider: 'LlmProvider',
    LlmModel: 'LlmModel'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "user" | "llmProvider" | "llmModel"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      LlmProvider: {
        payload: Prisma.$LlmProviderPayload<ExtArgs>
        fields: Prisma.LlmProviderFieldRefs
        operations: {
          findUnique: {
            args: Prisma.LlmProviderFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LlmProviderPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.LlmProviderFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LlmProviderPayload>
          }
          findFirst: {
            args: Prisma.LlmProviderFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LlmProviderPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.LlmProviderFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LlmProviderPayload>
          }
          findMany: {
            args: Prisma.LlmProviderFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LlmProviderPayload>[]
          }
          create: {
            args: Prisma.LlmProviderCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LlmProviderPayload>
          }
          createMany: {
            args: Prisma.LlmProviderCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.LlmProviderCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LlmProviderPayload>[]
          }
          delete: {
            args: Prisma.LlmProviderDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LlmProviderPayload>
          }
          update: {
            args: Prisma.LlmProviderUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LlmProviderPayload>
          }
          deleteMany: {
            args: Prisma.LlmProviderDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.LlmProviderUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.LlmProviderUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LlmProviderPayload>[]
          }
          upsert: {
            args: Prisma.LlmProviderUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LlmProviderPayload>
          }
          aggregate: {
            args: Prisma.LlmProviderAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLlmProvider>
          }
          groupBy: {
            args: Prisma.LlmProviderGroupByArgs<ExtArgs>
            result: $Utils.Optional<LlmProviderGroupByOutputType>[]
          }
          count: {
            args: Prisma.LlmProviderCountArgs<ExtArgs>
            result: $Utils.Optional<LlmProviderCountAggregateOutputType> | number
          }
        }
      }
      LlmModel: {
        payload: Prisma.$LlmModelPayload<ExtArgs>
        fields: Prisma.LlmModelFieldRefs
        operations: {
          findUnique: {
            args: Prisma.LlmModelFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LlmModelPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.LlmModelFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LlmModelPayload>
          }
          findFirst: {
            args: Prisma.LlmModelFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LlmModelPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.LlmModelFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LlmModelPayload>
          }
          findMany: {
            args: Prisma.LlmModelFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LlmModelPayload>[]
          }
          create: {
            args: Prisma.LlmModelCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LlmModelPayload>
          }
          createMany: {
            args: Prisma.LlmModelCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.LlmModelCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LlmModelPayload>[]
          }
          delete: {
            args: Prisma.LlmModelDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LlmModelPayload>
          }
          update: {
            args: Prisma.LlmModelUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LlmModelPayload>
          }
          deleteMany: {
            args: Prisma.LlmModelDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.LlmModelUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.LlmModelUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LlmModelPayload>[]
          }
          upsert: {
            args: Prisma.LlmModelUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LlmModelPayload>
          }
          aggregate: {
            args: Prisma.LlmModelAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLlmModel>
          }
          groupBy: {
            args: Prisma.LlmModelGroupByArgs<ExtArgs>
            result: $Utils.Optional<LlmModelGroupByOutputType>[]
          }
          count: {
            args: Prisma.LlmModelCountArgs<ExtArgs>
            result: $Utils.Optional<LlmModelCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    user?: UserOmit
    llmProvider?: LlmProviderOmit
    llmModel?: LlmModelOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type LlmProviderCountOutputType
   */

  export type LlmProviderCountOutputType = {
    models: number
  }

  export type LlmProviderCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    models?: boolean | LlmProviderCountOutputTypeCountModelsArgs
  }

  // Custom InputTypes
  /**
   * LlmProviderCountOutputType without action
   */
  export type LlmProviderCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LlmProviderCountOutputType
     */
    select?: LlmProviderCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * LlmProviderCountOutputType without action
   */
  export type LlmProviderCountOutputTypeCountModelsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LlmModelWhereInput
  }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    username: string | null
    password: string | null
    nickname: string | null
    avatar: string | null
    status: $Enums.UserStatus | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    username: string | null
    password: string | null
    nickname: string | null
    avatar: string | null
    status: $Enums.UserStatus | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    username: number
    password: number
    nickname: number
    avatar: number
    status: number
    roles: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type UserMinAggregateInputType = {
    id?: true
    username?: true
    password?: true
    nickname?: true
    avatar?: true
    status?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    username?: true
    password?: true
    nickname?: true
    avatar?: true
    status?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    username?: true
    password?: true
    nickname?: true
    avatar?: true
    status?: true
    roles?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    username: string
    password: string
    nickname: string | null
    avatar: string | null
    status: $Enums.UserStatus
    roles: $Enums.UserRole[]
    createdAt: Date
    updatedAt: Date
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    username?: boolean
    password?: boolean
    nickname?: boolean
    avatar?: boolean
    status?: boolean
    roles?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    username?: boolean
    password?: boolean
    nickname?: boolean
    avatar?: boolean
    status?: boolean
    roles?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    username?: boolean
    password?: boolean
    nickname?: boolean
    avatar?: boolean
    status?: boolean
    roles?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    username?: boolean
    password?: boolean
    nickname?: boolean
    avatar?: boolean
    status?: boolean
    roles?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "username" | "password" | "nickname" | "avatar" | "status" | "roles" | "createdAt" | "updatedAt", ExtArgs["result"]["user"]>

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      username: string
      password: string
      nickname: string | null
      avatar: string | null
      status: $Enums.UserStatus
      roles: $Enums.UserRole[]
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users and returns the data updated in the database.
     * @param {UserUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Users and only return the `id`
     * const userWithIdOnly = await prisma.user.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserUpdateManyAndReturnArgs>(args: SelectSubset<T, UserUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'String'>
    readonly username: FieldRef<"User", 'String'>
    readonly password: FieldRef<"User", 'String'>
    readonly nickname: FieldRef<"User", 'String'>
    readonly avatar: FieldRef<"User", 'String'>
    readonly status: FieldRef<"User", 'UserStatus'>
    readonly roles: FieldRef<"User", 'UserRole[]'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
    readonly updatedAt: FieldRef<"User", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User updateManyAndReturn
   */
  export type UserUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
  }


  /**
   * Model LlmProvider
   */

  export type AggregateLlmProvider = {
    _count: LlmProviderCountAggregateOutputType | null
    _min: LlmProviderMinAggregateOutputType | null
    _max: LlmProviderMaxAggregateOutputType | null
  }

  export type LlmProviderMinAggregateOutputType = {
    id: string | null
    name: string | null
    type: string | null
    baseUrl: string | null
    apiKey: string | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type LlmProviderMaxAggregateOutputType = {
    id: string | null
    name: string | null
    type: string | null
    baseUrl: string | null
    apiKey: string | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type LlmProviderCountAggregateOutputType = {
    id: number
    name: number
    type: number
    baseUrl: number
    apiKey: number
    isActive: number
    config: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type LlmProviderMinAggregateInputType = {
    id?: true
    name?: true
    type?: true
    baseUrl?: true
    apiKey?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type LlmProviderMaxAggregateInputType = {
    id?: true
    name?: true
    type?: true
    baseUrl?: true
    apiKey?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type LlmProviderCountAggregateInputType = {
    id?: true
    name?: true
    type?: true
    baseUrl?: true
    apiKey?: true
    isActive?: true
    config?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type LlmProviderAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which LlmProvider to aggregate.
     */
    where?: LlmProviderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LlmProviders to fetch.
     */
    orderBy?: LlmProviderOrderByWithRelationInput | LlmProviderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: LlmProviderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LlmProviders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LlmProviders.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned LlmProviders
    **/
    _count?: true | LlmProviderCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: LlmProviderMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: LlmProviderMaxAggregateInputType
  }

  export type GetLlmProviderAggregateType<T extends LlmProviderAggregateArgs> = {
        [P in keyof T & keyof AggregateLlmProvider]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLlmProvider[P]>
      : GetScalarType<T[P], AggregateLlmProvider[P]>
  }




  export type LlmProviderGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LlmProviderWhereInput
    orderBy?: LlmProviderOrderByWithAggregationInput | LlmProviderOrderByWithAggregationInput[]
    by: LlmProviderScalarFieldEnum[] | LlmProviderScalarFieldEnum
    having?: LlmProviderScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: LlmProviderCountAggregateInputType | true
    _min?: LlmProviderMinAggregateInputType
    _max?: LlmProviderMaxAggregateInputType
  }

  export type LlmProviderGroupByOutputType = {
    id: string
    name: string
    type: string
    baseUrl: string | null
    apiKey: string | null
    isActive: boolean
    config: JsonValue
    createdAt: Date
    updatedAt: Date
    _count: LlmProviderCountAggregateOutputType | null
    _min: LlmProviderMinAggregateOutputType | null
    _max: LlmProviderMaxAggregateOutputType | null
  }

  type GetLlmProviderGroupByPayload<T extends LlmProviderGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<LlmProviderGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof LlmProviderGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], LlmProviderGroupByOutputType[P]>
            : GetScalarType<T[P], LlmProviderGroupByOutputType[P]>
        }
      >
    >


  export type LlmProviderSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    type?: boolean
    baseUrl?: boolean
    apiKey?: boolean
    isActive?: boolean
    config?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    models?: boolean | LlmProvider$modelsArgs<ExtArgs>
    _count?: boolean | LlmProviderCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["llmProvider"]>

  export type LlmProviderSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    type?: boolean
    baseUrl?: boolean
    apiKey?: boolean
    isActive?: boolean
    config?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["llmProvider"]>

  export type LlmProviderSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    type?: boolean
    baseUrl?: boolean
    apiKey?: boolean
    isActive?: boolean
    config?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["llmProvider"]>

  export type LlmProviderSelectScalar = {
    id?: boolean
    name?: boolean
    type?: boolean
    baseUrl?: boolean
    apiKey?: boolean
    isActive?: boolean
    config?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type LlmProviderOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "type" | "baseUrl" | "apiKey" | "isActive" | "config" | "createdAt" | "updatedAt", ExtArgs["result"]["llmProvider"]>
  export type LlmProviderInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    models?: boolean | LlmProvider$modelsArgs<ExtArgs>
    _count?: boolean | LlmProviderCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type LlmProviderIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type LlmProviderIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $LlmProviderPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "LlmProvider"
    objects: {
      models: Prisma.$LlmModelPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      type: string
      baseUrl: string | null
      apiKey: string | null
      isActive: boolean
      config: Prisma.JsonValue
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["llmProvider"]>
    composites: {}
  }

  type LlmProviderGetPayload<S extends boolean | null | undefined | LlmProviderDefaultArgs> = $Result.GetResult<Prisma.$LlmProviderPayload, S>

  type LlmProviderCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<LlmProviderFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: LlmProviderCountAggregateInputType | true
    }

  export interface LlmProviderDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['LlmProvider'], meta: { name: 'LlmProvider' } }
    /**
     * Find zero or one LlmProvider that matches the filter.
     * @param {LlmProviderFindUniqueArgs} args - Arguments to find a LlmProvider
     * @example
     * // Get one LlmProvider
     * const llmProvider = await prisma.llmProvider.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends LlmProviderFindUniqueArgs>(args: SelectSubset<T, LlmProviderFindUniqueArgs<ExtArgs>>): Prisma__LlmProviderClient<$Result.GetResult<Prisma.$LlmProviderPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one LlmProvider that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {LlmProviderFindUniqueOrThrowArgs} args - Arguments to find a LlmProvider
     * @example
     * // Get one LlmProvider
     * const llmProvider = await prisma.llmProvider.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends LlmProviderFindUniqueOrThrowArgs>(args: SelectSubset<T, LlmProviderFindUniqueOrThrowArgs<ExtArgs>>): Prisma__LlmProviderClient<$Result.GetResult<Prisma.$LlmProviderPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first LlmProvider that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LlmProviderFindFirstArgs} args - Arguments to find a LlmProvider
     * @example
     * // Get one LlmProvider
     * const llmProvider = await prisma.llmProvider.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends LlmProviderFindFirstArgs>(args?: SelectSubset<T, LlmProviderFindFirstArgs<ExtArgs>>): Prisma__LlmProviderClient<$Result.GetResult<Prisma.$LlmProviderPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first LlmProvider that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LlmProviderFindFirstOrThrowArgs} args - Arguments to find a LlmProvider
     * @example
     * // Get one LlmProvider
     * const llmProvider = await prisma.llmProvider.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends LlmProviderFindFirstOrThrowArgs>(args?: SelectSubset<T, LlmProviderFindFirstOrThrowArgs<ExtArgs>>): Prisma__LlmProviderClient<$Result.GetResult<Prisma.$LlmProviderPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more LlmProviders that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LlmProviderFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all LlmProviders
     * const llmProviders = await prisma.llmProvider.findMany()
     * 
     * // Get first 10 LlmProviders
     * const llmProviders = await prisma.llmProvider.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const llmProviderWithIdOnly = await prisma.llmProvider.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends LlmProviderFindManyArgs>(args?: SelectSubset<T, LlmProviderFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LlmProviderPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a LlmProvider.
     * @param {LlmProviderCreateArgs} args - Arguments to create a LlmProvider.
     * @example
     * // Create one LlmProvider
     * const LlmProvider = await prisma.llmProvider.create({
     *   data: {
     *     // ... data to create a LlmProvider
     *   }
     * })
     * 
     */
    create<T extends LlmProviderCreateArgs>(args: SelectSubset<T, LlmProviderCreateArgs<ExtArgs>>): Prisma__LlmProviderClient<$Result.GetResult<Prisma.$LlmProviderPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many LlmProviders.
     * @param {LlmProviderCreateManyArgs} args - Arguments to create many LlmProviders.
     * @example
     * // Create many LlmProviders
     * const llmProvider = await prisma.llmProvider.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends LlmProviderCreateManyArgs>(args?: SelectSubset<T, LlmProviderCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many LlmProviders and returns the data saved in the database.
     * @param {LlmProviderCreateManyAndReturnArgs} args - Arguments to create many LlmProviders.
     * @example
     * // Create many LlmProviders
     * const llmProvider = await prisma.llmProvider.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many LlmProviders and only return the `id`
     * const llmProviderWithIdOnly = await prisma.llmProvider.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends LlmProviderCreateManyAndReturnArgs>(args?: SelectSubset<T, LlmProviderCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LlmProviderPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a LlmProvider.
     * @param {LlmProviderDeleteArgs} args - Arguments to delete one LlmProvider.
     * @example
     * // Delete one LlmProvider
     * const LlmProvider = await prisma.llmProvider.delete({
     *   where: {
     *     // ... filter to delete one LlmProvider
     *   }
     * })
     * 
     */
    delete<T extends LlmProviderDeleteArgs>(args: SelectSubset<T, LlmProviderDeleteArgs<ExtArgs>>): Prisma__LlmProviderClient<$Result.GetResult<Prisma.$LlmProviderPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one LlmProvider.
     * @param {LlmProviderUpdateArgs} args - Arguments to update one LlmProvider.
     * @example
     * // Update one LlmProvider
     * const llmProvider = await prisma.llmProvider.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends LlmProviderUpdateArgs>(args: SelectSubset<T, LlmProviderUpdateArgs<ExtArgs>>): Prisma__LlmProviderClient<$Result.GetResult<Prisma.$LlmProviderPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more LlmProviders.
     * @param {LlmProviderDeleteManyArgs} args - Arguments to filter LlmProviders to delete.
     * @example
     * // Delete a few LlmProviders
     * const { count } = await prisma.llmProvider.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends LlmProviderDeleteManyArgs>(args?: SelectSubset<T, LlmProviderDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more LlmProviders.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LlmProviderUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many LlmProviders
     * const llmProvider = await prisma.llmProvider.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends LlmProviderUpdateManyArgs>(args: SelectSubset<T, LlmProviderUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more LlmProviders and returns the data updated in the database.
     * @param {LlmProviderUpdateManyAndReturnArgs} args - Arguments to update many LlmProviders.
     * @example
     * // Update many LlmProviders
     * const llmProvider = await prisma.llmProvider.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more LlmProviders and only return the `id`
     * const llmProviderWithIdOnly = await prisma.llmProvider.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends LlmProviderUpdateManyAndReturnArgs>(args: SelectSubset<T, LlmProviderUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LlmProviderPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one LlmProvider.
     * @param {LlmProviderUpsertArgs} args - Arguments to update or create a LlmProvider.
     * @example
     * // Update or create a LlmProvider
     * const llmProvider = await prisma.llmProvider.upsert({
     *   create: {
     *     // ... data to create a LlmProvider
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the LlmProvider we want to update
     *   }
     * })
     */
    upsert<T extends LlmProviderUpsertArgs>(args: SelectSubset<T, LlmProviderUpsertArgs<ExtArgs>>): Prisma__LlmProviderClient<$Result.GetResult<Prisma.$LlmProviderPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of LlmProviders.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LlmProviderCountArgs} args - Arguments to filter LlmProviders to count.
     * @example
     * // Count the number of LlmProviders
     * const count = await prisma.llmProvider.count({
     *   where: {
     *     // ... the filter for the LlmProviders we want to count
     *   }
     * })
    **/
    count<T extends LlmProviderCountArgs>(
      args?: Subset<T, LlmProviderCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], LlmProviderCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a LlmProvider.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LlmProviderAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends LlmProviderAggregateArgs>(args: Subset<T, LlmProviderAggregateArgs>): Prisma.PrismaPromise<GetLlmProviderAggregateType<T>>

    /**
     * Group by LlmProvider.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LlmProviderGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends LlmProviderGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: LlmProviderGroupByArgs['orderBy'] }
        : { orderBy?: LlmProviderGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, LlmProviderGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLlmProviderGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the LlmProvider model
   */
  readonly fields: LlmProviderFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for LlmProvider.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__LlmProviderClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    models<T extends LlmProvider$modelsArgs<ExtArgs> = {}>(args?: Subset<T, LlmProvider$modelsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LlmModelPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the LlmProvider model
   */
  interface LlmProviderFieldRefs {
    readonly id: FieldRef<"LlmProvider", 'String'>
    readonly name: FieldRef<"LlmProvider", 'String'>
    readonly type: FieldRef<"LlmProvider", 'String'>
    readonly baseUrl: FieldRef<"LlmProvider", 'String'>
    readonly apiKey: FieldRef<"LlmProvider", 'String'>
    readonly isActive: FieldRef<"LlmProvider", 'Boolean'>
    readonly config: FieldRef<"LlmProvider", 'Json'>
    readonly createdAt: FieldRef<"LlmProvider", 'DateTime'>
    readonly updatedAt: FieldRef<"LlmProvider", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * LlmProvider findUnique
   */
  export type LlmProviderFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LlmProvider
     */
    select?: LlmProviderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LlmProvider
     */
    omit?: LlmProviderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LlmProviderInclude<ExtArgs> | null
    /**
     * Filter, which LlmProvider to fetch.
     */
    where: LlmProviderWhereUniqueInput
  }

  /**
   * LlmProvider findUniqueOrThrow
   */
  export type LlmProviderFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LlmProvider
     */
    select?: LlmProviderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LlmProvider
     */
    omit?: LlmProviderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LlmProviderInclude<ExtArgs> | null
    /**
     * Filter, which LlmProvider to fetch.
     */
    where: LlmProviderWhereUniqueInput
  }

  /**
   * LlmProvider findFirst
   */
  export type LlmProviderFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LlmProvider
     */
    select?: LlmProviderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LlmProvider
     */
    omit?: LlmProviderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LlmProviderInclude<ExtArgs> | null
    /**
     * Filter, which LlmProvider to fetch.
     */
    where?: LlmProviderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LlmProviders to fetch.
     */
    orderBy?: LlmProviderOrderByWithRelationInput | LlmProviderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for LlmProviders.
     */
    cursor?: LlmProviderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LlmProviders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LlmProviders.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of LlmProviders.
     */
    distinct?: LlmProviderScalarFieldEnum | LlmProviderScalarFieldEnum[]
  }

  /**
   * LlmProvider findFirstOrThrow
   */
  export type LlmProviderFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LlmProvider
     */
    select?: LlmProviderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LlmProvider
     */
    omit?: LlmProviderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LlmProviderInclude<ExtArgs> | null
    /**
     * Filter, which LlmProvider to fetch.
     */
    where?: LlmProviderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LlmProviders to fetch.
     */
    orderBy?: LlmProviderOrderByWithRelationInput | LlmProviderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for LlmProviders.
     */
    cursor?: LlmProviderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LlmProviders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LlmProviders.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of LlmProviders.
     */
    distinct?: LlmProviderScalarFieldEnum | LlmProviderScalarFieldEnum[]
  }

  /**
   * LlmProvider findMany
   */
  export type LlmProviderFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LlmProvider
     */
    select?: LlmProviderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LlmProvider
     */
    omit?: LlmProviderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LlmProviderInclude<ExtArgs> | null
    /**
     * Filter, which LlmProviders to fetch.
     */
    where?: LlmProviderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LlmProviders to fetch.
     */
    orderBy?: LlmProviderOrderByWithRelationInput | LlmProviderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing LlmProviders.
     */
    cursor?: LlmProviderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LlmProviders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LlmProviders.
     */
    skip?: number
    distinct?: LlmProviderScalarFieldEnum | LlmProviderScalarFieldEnum[]
  }

  /**
   * LlmProvider create
   */
  export type LlmProviderCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LlmProvider
     */
    select?: LlmProviderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LlmProvider
     */
    omit?: LlmProviderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LlmProviderInclude<ExtArgs> | null
    /**
     * The data needed to create a LlmProvider.
     */
    data: XOR<LlmProviderCreateInput, LlmProviderUncheckedCreateInput>
  }

  /**
   * LlmProvider createMany
   */
  export type LlmProviderCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many LlmProviders.
     */
    data: LlmProviderCreateManyInput | LlmProviderCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * LlmProvider createManyAndReturn
   */
  export type LlmProviderCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LlmProvider
     */
    select?: LlmProviderSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the LlmProvider
     */
    omit?: LlmProviderOmit<ExtArgs> | null
    /**
     * The data used to create many LlmProviders.
     */
    data: LlmProviderCreateManyInput | LlmProviderCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * LlmProvider update
   */
  export type LlmProviderUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LlmProvider
     */
    select?: LlmProviderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LlmProvider
     */
    omit?: LlmProviderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LlmProviderInclude<ExtArgs> | null
    /**
     * The data needed to update a LlmProvider.
     */
    data: XOR<LlmProviderUpdateInput, LlmProviderUncheckedUpdateInput>
    /**
     * Choose, which LlmProvider to update.
     */
    where: LlmProviderWhereUniqueInput
  }

  /**
   * LlmProvider updateMany
   */
  export type LlmProviderUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update LlmProviders.
     */
    data: XOR<LlmProviderUpdateManyMutationInput, LlmProviderUncheckedUpdateManyInput>
    /**
     * Filter which LlmProviders to update
     */
    where?: LlmProviderWhereInput
    /**
     * Limit how many LlmProviders to update.
     */
    limit?: number
  }

  /**
   * LlmProvider updateManyAndReturn
   */
  export type LlmProviderUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LlmProvider
     */
    select?: LlmProviderSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the LlmProvider
     */
    omit?: LlmProviderOmit<ExtArgs> | null
    /**
     * The data used to update LlmProviders.
     */
    data: XOR<LlmProviderUpdateManyMutationInput, LlmProviderUncheckedUpdateManyInput>
    /**
     * Filter which LlmProviders to update
     */
    where?: LlmProviderWhereInput
    /**
     * Limit how many LlmProviders to update.
     */
    limit?: number
  }

  /**
   * LlmProvider upsert
   */
  export type LlmProviderUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LlmProvider
     */
    select?: LlmProviderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LlmProvider
     */
    omit?: LlmProviderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LlmProviderInclude<ExtArgs> | null
    /**
     * The filter to search for the LlmProvider to update in case it exists.
     */
    where: LlmProviderWhereUniqueInput
    /**
     * In case the LlmProvider found by the `where` argument doesn't exist, create a new LlmProvider with this data.
     */
    create: XOR<LlmProviderCreateInput, LlmProviderUncheckedCreateInput>
    /**
     * In case the LlmProvider was found with the provided `where` argument, update it with this data.
     */
    update: XOR<LlmProviderUpdateInput, LlmProviderUncheckedUpdateInput>
  }

  /**
   * LlmProvider delete
   */
  export type LlmProviderDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LlmProvider
     */
    select?: LlmProviderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LlmProvider
     */
    omit?: LlmProviderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LlmProviderInclude<ExtArgs> | null
    /**
     * Filter which LlmProvider to delete.
     */
    where: LlmProviderWhereUniqueInput
  }

  /**
   * LlmProvider deleteMany
   */
  export type LlmProviderDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which LlmProviders to delete
     */
    where?: LlmProviderWhereInput
    /**
     * Limit how many LlmProviders to delete.
     */
    limit?: number
  }

  /**
   * LlmProvider.models
   */
  export type LlmProvider$modelsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LlmModel
     */
    select?: LlmModelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LlmModel
     */
    omit?: LlmModelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LlmModelInclude<ExtArgs> | null
    where?: LlmModelWhereInput
    orderBy?: LlmModelOrderByWithRelationInput | LlmModelOrderByWithRelationInput[]
    cursor?: LlmModelWhereUniqueInput
    take?: number
    skip?: number
    distinct?: LlmModelScalarFieldEnum | LlmModelScalarFieldEnum[]
  }

  /**
   * LlmProvider without action
   */
  export type LlmProviderDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LlmProvider
     */
    select?: LlmProviderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LlmProvider
     */
    omit?: LlmProviderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LlmProviderInclude<ExtArgs> | null
  }


  /**
   * Model LlmModel
   */

  export type AggregateLlmModel = {
    _count: LlmModelCountAggregateOutputType | null
    _min: LlmModelMinAggregateOutputType | null
    _max: LlmModelMaxAggregateOutputType | null
  }

  export type LlmModelMinAggregateOutputType = {
    id: string | null
    providerId: string | null
    modelName: string | null
    displayName: string | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type LlmModelMaxAggregateOutputType = {
    id: string | null
    providerId: string | null
    modelName: string | null
    displayName: string | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type LlmModelCountAggregateOutputType = {
    id: number
    providerId: number
    modelName: number
    displayName: number
    isActive: number
    config: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type LlmModelMinAggregateInputType = {
    id?: true
    providerId?: true
    modelName?: true
    displayName?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type LlmModelMaxAggregateInputType = {
    id?: true
    providerId?: true
    modelName?: true
    displayName?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type LlmModelCountAggregateInputType = {
    id?: true
    providerId?: true
    modelName?: true
    displayName?: true
    isActive?: true
    config?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type LlmModelAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which LlmModel to aggregate.
     */
    where?: LlmModelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LlmModels to fetch.
     */
    orderBy?: LlmModelOrderByWithRelationInput | LlmModelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: LlmModelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LlmModels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LlmModels.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned LlmModels
    **/
    _count?: true | LlmModelCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: LlmModelMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: LlmModelMaxAggregateInputType
  }

  export type GetLlmModelAggregateType<T extends LlmModelAggregateArgs> = {
        [P in keyof T & keyof AggregateLlmModel]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLlmModel[P]>
      : GetScalarType<T[P], AggregateLlmModel[P]>
  }




  export type LlmModelGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LlmModelWhereInput
    orderBy?: LlmModelOrderByWithAggregationInput | LlmModelOrderByWithAggregationInput[]
    by: LlmModelScalarFieldEnum[] | LlmModelScalarFieldEnum
    having?: LlmModelScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: LlmModelCountAggregateInputType | true
    _min?: LlmModelMinAggregateInputType
    _max?: LlmModelMaxAggregateInputType
  }

  export type LlmModelGroupByOutputType = {
    id: string
    providerId: string
    modelName: string
    displayName: string | null
    isActive: boolean
    config: JsonValue
    createdAt: Date
    updatedAt: Date
    _count: LlmModelCountAggregateOutputType | null
    _min: LlmModelMinAggregateOutputType | null
    _max: LlmModelMaxAggregateOutputType | null
  }

  type GetLlmModelGroupByPayload<T extends LlmModelGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<LlmModelGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof LlmModelGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], LlmModelGroupByOutputType[P]>
            : GetScalarType<T[P], LlmModelGroupByOutputType[P]>
        }
      >
    >


  export type LlmModelSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    providerId?: boolean
    modelName?: boolean
    displayName?: boolean
    isActive?: boolean
    config?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    provider?: boolean | LlmProviderDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["llmModel"]>

  export type LlmModelSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    providerId?: boolean
    modelName?: boolean
    displayName?: boolean
    isActive?: boolean
    config?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    provider?: boolean | LlmProviderDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["llmModel"]>

  export type LlmModelSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    providerId?: boolean
    modelName?: boolean
    displayName?: boolean
    isActive?: boolean
    config?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    provider?: boolean | LlmProviderDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["llmModel"]>

  export type LlmModelSelectScalar = {
    id?: boolean
    providerId?: boolean
    modelName?: boolean
    displayName?: boolean
    isActive?: boolean
    config?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type LlmModelOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "providerId" | "modelName" | "displayName" | "isActive" | "config" | "createdAt" | "updatedAt", ExtArgs["result"]["llmModel"]>
  export type LlmModelInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    provider?: boolean | LlmProviderDefaultArgs<ExtArgs>
  }
  export type LlmModelIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    provider?: boolean | LlmProviderDefaultArgs<ExtArgs>
  }
  export type LlmModelIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    provider?: boolean | LlmProviderDefaultArgs<ExtArgs>
  }

  export type $LlmModelPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "LlmModel"
    objects: {
      provider: Prisma.$LlmProviderPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      providerId: string
      modelName: string
      displayName: string | null
      isActive: boolean
      config: Prisma.JsonValue
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["llmModel"]>
    composites: {}
  }

  type LlmModelGetPayload<S extends boolean | null | undefined | LlmModelDefaultArgs> = $Result.GetResult<Prisma.$LlmModelPayload, S>

  type LlmModelCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<LlmModelFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: LlmModelCountAggregateInputType | true
    }

  export interface LlmModelDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['LlmModel'], meta: { name: 'LlmModel' } }
    /**
     * Find zero or one LlmModel that matches the filter.
     * @param {LlmModelFindUniqueArgs} args - Arguments to find a LlmModel
     * @example
     * // Get one LlmModel
     * const llmModel = await prisma.llmModel.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends LlmModelFindUniqueArgs>(args: SelectSubset<T, LlmModelFindUniqueArgs<ExtArgs>>): Prisma__LlmModelClient<$Result.GetResult<Prisma.$LlmModelPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one LlmModel that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {LlmModelFindUniqueOrThrowArgs} args - Arguments to find a LlmModel
     * @example
     * // Get one LlmModel
     * const llmModel = await prisma.llmModel.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends LlmModelFindUniqueOrThrowArgs>(args: SelectSubset<T, LlmModelFindUniqueOrThrowArgs<ExtArgs>>): Prisma__LlmModelClient<$Result.GetResult<Prisma.$LlmModelPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first LlmModel that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LlmModelFindFirstArgs} args - Arguments to find a LlmModel
     * @example
     * // Get one LlmModel
     * const llmModel = await prisma.llmModel.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends LlmModelFindFirstArgs>(args?: SelectSubset<T, LlmModelFindFirstArgs<ExtArgs>>): Prisma__LlmModelClient<$Result.GetResult<Prisma.$LlmModelPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first LlmModel that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LlmModelFindFirstOrThrowArgs} args - Arguments to find a LlmModel
     * @example
     * // Get one LlmModel
     * const llmModel = await prisma.llmModel.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends LlmModelFindFirstOrThrowArgs>(args?: SelectSubset<T, LlmModelFindFirstOrThrowArgs<ExtArgs>>): Prisma__LlmModelClient<$Result.GetResult<Prisma.$LlmModelPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more LlmModels that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LlmModelFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all LlmModels
     * const llmModels = await prisma.llmModel.findMany()
     * 
     * // Get first 10 LlmModels
     * const llmModels = await prisma.llmModel.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const llmModelWithIdOnly = await prisma.llmModel.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends LlmModelFindManyArgs>(args?: SelectSubset<T, LlmModelFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LlmModelPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a LlmModel.
     * @param {LlmModelCreateArgs} args - Arguments to create a LlmModel.
     * @example
     * // Create one LlmModel
     * const LlmModel = await prisma.llmModel.create({
     *   data: {
     *     // ... data to create a LlmModel
     *   }
     * })
     * 
     */
    create<T extends LlmModelCreateArgs>(args: SelectSubset<T, LlmModelCreateArgs<ExtArgs>>): Prisma__LlmModelClient<$Result.GetResult<Prisma.$LlmModelPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many LlmModels.
     * @param {LlmModelCreateManyArgs} args - Arguments to create many LlmModels.
     * @example
     * // Create many LlmModels
     * const llmModel = await prisma.llmModel.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends LlmModelCreateManyArgs>(args?: SelectSubset<T, LlmModelCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many LlmModels and returns the data saved in the database.
     * @param {LlmModelCreateManyAndReturnArgs} args - Arguments to create many LlmModels.
     * @example
     * // Create many LlmModels
     * const llmModel = await prisma.llmModel.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many LlmModels and only return the `id`
     * const llmModelWithIdOnly = await prisma.llmModel.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends LlmModelCreateManyAndReturnArgs>(args?: SelectSubset<T, LlmModelCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LlmModelPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a LlmModel.
     * @param {LlmModelDeleteArgs} args - Arguments to delete one LlmModel.
     * @example
     * // Delete one LlmModel
     * const LlmModel = await prisma.llmModel.delete({
     *   where: {
     *     // ... filter to delete one LlmModel
     *   }
     * })
     * 
     */
    delete<T extends LlmModelDeleteArgs>(args: SelectSubset<T, LlmModelDeleteArgs<ExtArgs>>): Prisma__LlmModelClient<$Result.GetResult<Prisma.$LlmModelPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one LlmModel.
     * @param {LlmModelUpdateArgs} args - Arguments to update one LlmModel.
     * @example
     * // Update one LlmModel
     * const llmModel = await prisma.llmModel.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends LlmModelUpdateArgs>(args: SelectSubset<T, LlmModelUpdateArgs<ExtArgs>>): Prisma__LlmModelClient<$Result.GetResult<Prisma.$LlmModelPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more LlmModels.
     * @param {LlmModelDeleteManyArgs} args - Arguments to filter LlmModels to delete.
     * @example
     * // Delete a few LlmModels
     * const { count } = await prisma.llmModel.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends LlmModelDeleteManyArgs>(args?: SelectSubset<T, LlmModelDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more LlmModels.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LlmModelUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many LlmModels
     * const llmModel = await prisma.llmModel.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends LlmModelUpdateManyArgs>(args: SelectSubset<T, LlmModelUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more LlmModels and returns the data updated in the database.
     * @param {LlmModelUpdateManyAndReturnArgs} args - Arguments to update many LlmModels.
     * @example
     * // Update many LlmModels
     * const llmModel = await prisma.llmModel.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more LlmModels and only return the `id`
     * const llmModelWithIdOnly = await prisma.llmModel.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends LlmModelUpdateManyAndReturnArgs>(args: SelectSubset<T, LlmModelUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LlmModelPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one LlmModel.
     * @param {LlmModelUpsertArgs} args - Arguments to update or create a LlmModel.
     * @example
     * // Update or create a LlmModel
     * const llmModel = await prisma.llmModel.upsert({
     *   create: {
     *     // ... data to create a LlmModel
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the LlmModel we want to update
     *   }
     * })
     */
    upsert<T extends LlmModelUpsertArgs>(args: SelectSubset<T, LlmModelUpsertArgs<ExtArgs>>): Prisma__LlmModelClient<$Result.GetResult<Prisma.$LlmModelPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of LlmModels.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LlmModelCountArgs} args - Arguments to filter LlmModels to count.
     * @example
     * // Count the number of LlmModels
     * const count = await prisma.llmModel.count({
     *   where: {
     *     // ... the filter for the LlmModels we want to count
     *   }
     * })
    **/
    count<T extends LlmModelCountArgs>(
      args?: Subset<T, LlmModelCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], LlmModelCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a LlmModel.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LlmModelAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends LlmModelAggregateArgs>(args: Subset<T, LlmModelAggregateArgs>): Prisma.PrismaPromise<GetLlmModelAggregateType<T>>

    /**
     * Group by LlmModel.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LlmModelGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends LlmModelGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: LlmModelGroupByArgs['orderBy'] }
        : { orderBy?: LlmModelGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, LlmModelGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLlmModelGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the LlmModel model
   */
  readonly fields: LlmModelFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for LlmModel.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__LlmModelClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    provider<T extends LlmProviderDefaultArgs<ExtArgs> = {}>(args?: Subset<T, LlmProviderDefaultArgs<ExtArgs>>): Prisma__LlmProviderClient<$Result.GetResult<Prisma.$LlmProviderPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the LlmModel model
   */
  interface LlmModelFieldRefs {
    readonly id: FieldRef<"LlmModel", 'String'>
    readonly providerId: FieldRef<"LlmModel", 'String'>
    readonly modelName: FieldRef<"LlmModel", 'String'>
    readonly displayName: FieldRef<"LlmModel", 'String'>
    readonly isActive: FieldRef<"LlmModel", 'Boolean'>
    readonly config: FieldRef<"LlmModel", 'Json'>
    readonly createdAt: FieldRef<"LlmModel", 'DateTime'>
    readonly updatedAt: FieldRef<"LlmModel", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * LlmModel findUnique
   */
  export type LlmModelFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LlmModel
     */
    select?: LlmModelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LlmModel
     */
    omit?: LlmModelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LlmModelInclude<ExtArgs> | null
    /**
     * Filter, which LlmModel to fetch.
     */
    where: LlmModelWhereUniqueInput
  }

  /**
   * LlmModel findUniqueOrThrow
   */
  export type LlmModelFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LlmModel
     */
    select?: LlmModelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LlmModel
     */
    omit?: LlmModelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LlmModelInclude<ExtArgs> | null
    /**
     * Filter, which LlmModel to fetch.
     */
    where: LlmModelWhereUniqueInput
  }

  /**
   * LlmModel findFirst
   */
  export type LlmModelFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LlmModel
     */
    select?: LlmModelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LlmModel
     */
    omit?: LlmModelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LlmModelInclude<ExtArgs> | null
    /**
     * Filter, which LlmModel to fetch.
     */
    where?: LlmModelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LlmModels to fetch.
     */
    orderBy?: LlmModelOrderByWithRelationInput | LlmModelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for LlmModels.
     */
    cursor?: LlmModelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LlmModels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LlmModels.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of LlmModels.
     */
    distinct?: LlmModelScalarFieldEnum | LlmModelScalarFieldEnum[]
  }

  /**
   * LlmModel findFirstOrThrow
   */
  export type LlmModelFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LlmModel
     */
    select?: LlmModelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LlmModel
     */
    omit?: LlmModelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LlmModelInclude<ExtArgs> | null
    /**
     * Filter, which LlmModel to fetch.
     */
    where?: LlmModelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LlmModels to fetch.
     */
    orderBy?: LlmModelOrderByWithRelationInput | LlmModelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for LlmModels.
     */
    cursor?: LlmModelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LlmModels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LlmModels.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of LlmModels.
     */
    distinct?: LlmModelScalarFieldEnum | LlmModelScalarFieldEnum[]
  }

  /**
   * LlmModel findMany
   */
  export type LlmModelFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LlmModel
     */
    select?: LlmModelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LlmModel
     */
    omit?: LlmModelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LlmModelInclude<ExtArgs> | null
    /**
     * Filter, which LlmModels to fetch.
     */
    where?: LlmModelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LlmModels to fetch.
     */
    orderBy?: LlmModelOrderByWithRelationInput | LlmModelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing LlmModels.
     */
    cursor?: LlmModelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LlmModels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LlmModels.
     */
    skip?: number
    distinct?: LlmModelScalarFieldEnum | LlmModelScalarFieldEnum[]
  }

  /**
   * LlmModel create
   */
  export type LlmModelCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LlmModel
     */
    select?: LlmModelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LlmModel
     */
    omit?: LlmModelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LlmModelInclude<ExtArgs> | null
    /**
     * The data needed to create a LlmModel.
     */
    data: XOR<LlmModelCreateInput, LlmModelUncheckedCreateInput>
  }

  /**
   * LlmModel createMany
   */
  export type LlmModelCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many LlmModels.
     */
    data: LlmModelCreateManyInput | LlmModelCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * LlmModel createManyAndReturn
   */
  export type LlmModelCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LlmModel
     */
    select?: LlmModelSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the LlmModel
     */
    omit?: LlmModelOmit<ExtArgs> | null
    /**
     * The data used to create many LlmModels.
     */
    data: LlmModelCreateManyInput | LlmModelCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LlmModelIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * LlmModel update
   */
  export type LlmModelUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LlmModel
     */
    select?: LlmModelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LlmModel
     */
    omit?: LlmModelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LlmModelInclude<ExtArgs> | null
    /**
     * The data needed to update a LlmModel.
     */
    data: XOR<LlmModelUpdateInput, LlmModelUncheckedUpdateInput>
    /**
     * Choose, which LlmModel to update.
     */
    where: LlmModelWhereUniqueInput
  }

  /**
   * LlmModel updateMany
   */
  export type LlmModelUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update LlmModels.
     */
    data: XOR<LlmModelUpdateManyMutationInput, LlmModelUncheckedUpdateManyInput>
    /**
     * Filter which LlmModels to update
     */
    where?: LlmModelWhereInput
    /**
     * Limit how many LlmModels to update.
     */
    limit?: number
  }

  /**
   * LlmModel updateManyAndReturn
   */
  export type LlmModelUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LlmModel
     */
    select?: LlmModelSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the LlmModel
     */
    omit?: LlmModelOmit<ExtArgs> | null
    /**
     * The data used to update LlmModels.
     */
    data: XOR<LlmModelUpdateManyMutationInput, LlmModelUncheckedUpdateManyInput>
    /**
     * Filter which LlmModels to update
     */
    where?: LlmModelWhereInput
    /**
     * Limit how many LlmModels to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LlmModelIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * LlmModel upsert
   */
  export type LlmModelUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LlmModel
     */
    select?: LlmModelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LlmModel
     */
    omit?: LlmModelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LlmModelInclude<ExtArgs> | null
    /**
     * The filter to search for the LlmModel to update in case it exists.
     */
    where: LlmModelWhereUniqueInput
    /**
     * In case the LlmModel found by the `where` argument doesn't exist, create a new LlmModel with this data.
     */
    create: XOR<LlmModelCreateInput, LlmModelUncheckedCreateInput>
    /**
     * In case the LlmModel was found with the provided `where` argument, update it with this data.
     */
    update: XOR<LlmModelUpdateInput, LlmModelUncheckedUpdateInput>
  }

  /**
   * LlmModel delete
   */
  export type LlmModelDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LlmModel
     */
    select?: LlmModelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LlmModel
     */
    omit?: LlmModelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LlmModelInclude<ExtArgs> | null
    /**
     * Filter which LlmModel to delete.
     */
    where: LlmModelWhereUniqueInput
  }

  /**
   * LlmModel deleteMany
   */
  export type LlmModelDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which LlmModels to delete
     */
    where?: LlmModelWhereInput
    /**
     * Limit how many LlmModels to delete.
     */
    limit?: number
  }

  /**
   * LlmModel without action
   */
  export type LlmModelDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LlmModel
     */
    select?: LlmModelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LlmModel
     */
    omit?: LlmModelOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LlmModelInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const UserScalarFieldEnum: {
    id: 'id',
    username: 'username',
    password: 'password',
    nickname: 'nickname',
    avatar: 'avatar',
    status: 'status',
    roles: 'roles',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const LlmProviderScalarFieldEnum: {
    id: 'id',
    name: 'name',
    type: 'type',
    baseUrl: 'baseUrl',
    apiKey: 'apiKey',
    isActive: 'isActive',
    config: 'config',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type LlmProviderScalarFieldEnum = (typeof LlmProviderScalarFieldEnum)[keyof typeof LlmProviderScalarFieldEnum]


  export const LlmModelScalarFieldEnum: {
    id: 'id',
    providerId: 'providerId',
    modelName: 'modelName',
    displayName: 'displayName',
    isActive: 'isActive',
    config: 'config',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type LlmModelScalarFieldEnum = (typeof LlmModelScalarFieldEnum)[keyof typeof LlmModelScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'UserStatus'
   */
  export type EnumUserStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'UserStatus'>
    


  /**
   * Reference to a field of type 'UserStatus[]'
   */
  export type ListEnumUserStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'UserStatus[]'>
    


  /**
   * Reference to a field of type 'UserRole[]'
   */
  export type ListEnumUserRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'UserRole[]'>
    


  /**
   * Reference to a field of type 'UserRole'
   */
  export type EnumUserRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'UserRole'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    
  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    username?: StringFilter<"User"> | string
    password?: StringFilter<"User"> | string
    nickname?: StringNullableFilter<"User"> | string | null
    avatar?: StringNullableFilter<"User"> | string | null
    status?: EnumUserStatusFilter<"User"> | $Enums.UserStatus
    roles?: EnumUserRoleNullableListFilter<"User">
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    username?: SortOrder
    password?: SortOrder
    nickname?: SortOrderInput | SortOrder
    avatar?: SortOrderInput | SortOrder
    status?: SortOrder
    roles?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    username?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    password?: StringFilter<"User"> | string
    nickname?: StringNullableFilter<"User"> | string | null
    avatar?: StringNullableFilter<"User"> | string | null
    status?: EnumUserStatusFilter<"User"> | $Enums.UserStatus
    roles?: EnumUserRoleNullableListFilter<"User">
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
  }, "id" | "username">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    username?: SortOrder
    password?: SortOrder
    nickname?: SortOrderInput | SortOrder
    avatar?: SortOrderInput | SortOrder
    status?: SortOrder
    roles?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    username?: StringWithAggregatesFilter<"User"> | string
    password?: StringWithAggregatesFilter<"User"> | string
    nickname?: StringNullableWithAggregatesFilter<"User"> | string | null
    avatar?: StringNullableWithAggregatesFilter<"User"> | string | null
    status?: EnumUserStatusWithAggregatesFilter<"User"> | $Enums.UserStatus
    roles?: EnumUserRoleNullableListFilter<"User">
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
  }

  export type LlmProviderWhereInput = {
    AND?: LlmProviderWhereInput | LlmProviderWhereInput[]
    OR?: LlmProviderWhereInput[]
    NOT?: LlmProviderWhereInput | LlmProviderWhereInput[]
    id?: StringFilter<"LlmProvider"> | string
    name?: StringFilter<"LlmProvider"> | string
    type?: StringFilter<"LlmProvider"> | string
    baseUrl?: StringNullableFilter<"LlmProvider"> | string | null
    apiKey?: StringNullableFilter<"LlmProvider"> | string | null
    isActive?: BoolFilter<"LlmProvider"> | boolean
    config?: JsonFilter<"LlmProvider">
    createdAt?: DateTimeFilter<"LlmProvider"> | Date | string
    updatedAt?: DateTimeFilter<"LlmProvider"> | Date | string
    models?: LlmModelListRelationFilter
  }

  export type LlmProviderOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    type?: SortOrder
    baseUrl?: SortOrderInput | SortOrder
    apiKey?: SortOrderInput | SortOrder
    isActive?: SortOrder
    config?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    models?: LlmModelOrderByRelationAggregateInput
  }

  export type LlmProviderWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: LlmProviderWhereInput | LlmProviderWhereInput[]
    OR?: LlmProviderWhereInput[]
    NOT?: LlmProviderWhereInput | LlmProviderWhereInput[]
    name?: StringFilter<"LlmProvider"> | string
    type?: StringFilter<"LlmProvider"> | string
    baseUrl?: StringNullableFilter<"LlmProvider"> | string | null
    apiKey?: StringNullableFilter<"LlmProvider"> | string | null
    isActive?: BoolFilter<"LlmProvider"> | boolean
    config?: JsonFilter<"LlmProvider">
    createdAt?: DateTimeFilter<"LlmProvider"> | Date | string
    updatedAt?: DateTimeFilter<"LlmProvider"> | Date | string
    models?: LlmModelListRelationFilter
  }, "id">

  export type LlmProviderOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    type?: SortOrder
    baseUrl?: SortOrderInput | SortOrder
    apiKey?: SortOrderInput | SortOrder
    isActive?: SortOrder
    config?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: LlmProviderCountOrderByAggregateInput
    _max?: LlmProviderMaxOrderByAggregateInput
    _min?: LlmProviderMinOrderByAggregateInput
  }

  export type LlmProviderScalarWhereWithAggregatesInput = {
    AND?: LlmProviderScalarWhereWithAggregatesInput | LlmProviderScalarWhereWithAggregatesInput[]
    OR?: LlmProviderScalarWhereWithAggregatesInput[]
    NOT?: LlmProviderScalarWhereWithAggregatesInput | LlmProviderScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"LlmProvider"> | string
    name?: StringWithAggregatesFilter<"LlmProvider"> | string
    type?: StringWithAggregatesFilter<"LlmProvider"> | string
    baseUrl?: StringNullableWithAggregatesFilter<"LlmProvider"> | string | null
    apiKey?: StringNullableWithAggregatesFilter<"LlmProvider"> | string | null
    isActive?: BoolWithAggregatesFilter<"LlmProvider"> | boolean
    config?: JsonWithAggregatesFilter<"LlmProvider">
    createdAt?: DateTimeWithAggregatesFilter<"LlmProvider"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"LlmProvider"> | Date | string
  }

  export type LlmModelWhereInput = {
    AND?: LlmModelWhereInput | LlmModelWhereInput[]
    OR?: LlmModelWhereInput[]
    NOT?: LlmModelWhereInput | LlmModelWhereInput[]
    id?: StringFilter<"LlmModel"> | string
    providerId?: StringFilter<"LlmModel"> | string
    modelName?: StringFilter<"LlmModel"> | string
    displayName?: StringNullableFilter<"LlmModel"> | string | null
    isActive?: BoolFilter<"LlmModel"> | boolean
    config?: JsonFilter<"LlmModel">
    createdAt?: DateTimeFilter<"LlmModel"> | Date | string
    updatedAt?: DateTimeFilter<"LlmModel"> | Date | string
    provider?: XOR<LlmProviderScalarRelationFilter, LlmProviderWhereInput>
  }

  export type LlmModelOrderByWithRelationInput = {
    id?: SortOrder
    providerId?: SortOrder
    modelName?: SortOrder
    displayName?: SortOrderInput | SortOrder
    isActive?: SortOrder
    config?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    provider?: LlmProviderOrderByWithRelationInput
  }

  export type LlmModelWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    providerId_modelName?: LlmModelProviderIdModelNameCompoundUniqueInput
    AND?: LlmModelWhereInput | LlmModelWhereInput[]
    OR?: LlmModelWhereInput[]
    NOT?: LlmModelWhereInput | LlmModelWhereInput[]
    providerId?: StringFilter<"LlmModel"> | string
    modelName?: StringFilter<"LlmModel"> | string
    displayName?: StringNullableFilter<"LlmModel"> | string | null
    isActive?: BoolFilter<"LlmModel"> | boolean
    config?: JsonFilter<"LlmModel">
    createdAt?: DateTimeFilter<"LlmModel"> | Date | string
    updatedAt?: DateTimeFilter<"LlmModel"> | Date | string
    provider?: XOR<LlmProviderScalarRelationFilter, LlmProviderWhereInput>
  }, "id" | "providerId_modelName">

  export type LlmModelOrderByWithAggregationInput = {
    id?: SortOrder
    providerId?: SortOrder
    modelName?: SortOrder
    displayName?: SortOrderInput | SortOrder
    isActive?: SortOrder
    config?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: LlmModelCountOrderByAggregateInput
    _max?: LlmModelMaxOrderByAggregateInput
    _min?: LlmModelMinOrderByAggregateInput
  }

  export type LlmModelScalarWhereWithAggregatesInput = {
    AND?: LlmModelScalarWhereWithAggregatesInput | LlmModelScalarWhereWithAggregatesInput[]
    OR?: LlmModelScalarWhereWithAggregatesInput[]
    NOT?: LlmModelScalarWhereWithAggregatesInput | LlmModelScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"LlmModel"> | string
    providerId?: StringWithAggregatesFilter<"LlmModel"> | string
    modelName?: StringWithAggregatesFilter<"LlmModel"> | string
    displayName?: StringNullableWithAggregatesFilter<"LlmModel"> | string | null
    isActive?: BoolWithAggregatesFilter<"LlmModel"> | boolean
    config?: JsonWithAggregatesFilter<"LlmModel">
    createdAt?: DateTimeWithAggregatesFilter<"LlmModel"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"LlmModel"> | Date | string
  }

  export type UserCreateInput = {
    id?: string
    username: string
    password: string
    nickname?: string | null
    avatar?: string | null
    status?: $Enums.UserStatus
    roles?: UserCreaterolesInput | $Enums.UserRole[]
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserUncheckedCreateInput = {
    id?: string
    username: string
    password: string
    nickname?: string | null
    avatar?: string | null
    status?: $Enums.UserStatus
    roles?: UserCreaterolesInput | $Enums.UserRole[]
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    nickname?: NullableStringFieldUpdateOperationsInput | string | null
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumUserStatusFieldUpdateOperationsInput | $Enums.UserStatus
    roles?: UserUpdaterolesInput | $Enums.UserRole[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    nickname?: NullableStringFieldUpdateOperationsInput | string | null
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumUserStatusFieldUpdateOperationsInput | $Enums.UserStatus
    roles?: UserUpdaterolesInput | $Enums.UserRole[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserCreateManyInput = {
    id?: string
    username: string
    password: string
    nickname?: string | null
    avatar?: string | null
    status?: $Enums.UserStatus
    roles?: UserCreaterolesInput | $Enums.UserRole[]
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    nickname?: NullableStringFieldUpdateOperationsInput | string | null
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumUserStatusFieldUpdateOperationsInput | $Enums.UserStatus
    roles?: UserUpdaterolesInput | $Enums.UserRole[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    nickname?: NullableStringFieldUpdateOperationsInput | string | null
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumUserStatusFieldUpdateOperationsInput | $Enums.UserStatus
    roles?: UserUpdaterolesInput | $Enums.UserRole[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LlmProviderCreateInput = {
    id?: string
    name: string
    type: string
    baseUrl?: string | null
    apiKey?: string | null
    isActive?: boolean
    config?: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    models?: LlmModelCreateNestedManyWithoutProviderInput
  }

  export type LlmProviderUncheckedCreateInput = {
    id?: string
    name: string
    type: string
    baseUrl?: string | null
    apiKey?: string | null
    isActive?: boolean
    config?: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    models?: LlmModelUncheckedCreateNestedManyWithoutProviderInput
  }

  export type LlmProviderUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    baseUrl?: NullableStringFieldUpdateOperationsInput | string | null
    apiKey?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    config?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    models?: LlmModelUpdateManyWithoutProviderNestedInput
  }

  export type LlmProviderUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    baseUrl?: NullableStringFieldUpdateOperationsInput | string | null
    apiKey?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    config?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    models?: LlmModelUncheckedUpdateManyWithoutProviderNestedInput
  }

  export type LlmProviderCreateManyInput = {
    id?: string
    name: string
    type: string
    baseUrl?: string | null
    apiKey?: string | null
    isActive?: boolean
    config?: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LlmProviderUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    baseUrl?: NullableStringFieldUpdateOperationsInput | string | null
    apiKey?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    config?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LlmProviderUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    baseUrl?: NullableStringFieldUpdateOperationsInput | string | null
    apiKey?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    config?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LlmModelCreateInput = {
    id?: string
    modelName: string
    displayName?: string | null
    isActive?: boolean
    config?: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    provider: LlmProviderCreateNestedOneWithoutModelsInput
  }

  export type LlmModelUncheckedCreateInput = {
    id?: string
    providerId: string
    modelName: string
    displayName?: string | null
    isActive?: boolean
    config?: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LlmModelUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    modelName?: StringFieldUpdateOperationsInput | string
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    config?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    provider?: LlmProviderUpdateOneRequiredWithoutModelsNestedInput
  }

  export type LlmModelUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    providerId?: StringFieldUpdateOperationsInput | string
    modelName?: StringFieldUpdateOperationsInput | string
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    config?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LlmModelCreateManyInput = {
    id?: string
    providerId: string
    modelName: string
    displayName?: string | null
    isActive?: boolean
    config?: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LlmModelUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    modelName?: StringFieldUpdateOperationsInput | string
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    config?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LlmModelUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    providerId?: StringFieldUpdateOperationsInput | string
    modelName?: StringFieldUpdateOperationsInput | string
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    config?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type EnumUserStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.UserStatus | EnumUserStatusFieldRefInput<$PrismaModel>
    in?: $Enums.UserStatus[] | ListEnumUserStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserStatus[] | ListEnumUserStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumUserStatusFilter<$PrismaModel> | $Enums.UserStatus
  }

  export type EnumUserRoleNullableListFilter<$PrismaModel = never> = {
    equals?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel> | null
    has?: $Enums.UserRole | EnumUserRoleFieldRefInput<$PrismaModel> | null
    hasEvery?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    hasSome?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    isEmpty?: boolean
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    username?: SortOrder
    password?: SortOrder
    nickname?: SortOrder
    avatar?: SortOrder
    status?: SortOrder
    roles?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    username?: SortOrder
    password?: SortOrder
    nickname?: SortOrder
    avatar?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    username?: SortOrder
    password?: SortOrder
    nickname?: SortOrder
    avatar?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type EnumUserStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.UserStatus | EnumUserStatusFieldRefInput<$PrismaModel>
    in?: $Enums.UserStatus[] | ListEnumUserStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserStatus[] | ListEnumUserStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumUserStatusWithAggregatesFilter<$PrismaModel> | $Enums.UserStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumUserStatusFilter<$PrismaModel>
    _max?: NestedEnumUserStatusFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }
  export type JsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type LlmModelListRelationFilter = {
    every?: LlmModelWhereInput
    some?: LlmModelWhereInput
    none?: LlmModelWhereInput
  }

  export type LlmModelOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type LlmProviderCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    type?: SortOrder
    baseUrl?: SortOrder
    apiKey?: SortOrder
    isActive?: SortOrder
    config?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LlmProviderMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    type?: SortOrder
    baseUrl?: SortOrder
    apiKey?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LlmProviderMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    type?: SortOrder
    baseUrl?: SortOrder
    apiKey?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type LlmProviderScalarRelationFilter = {
    is?: LlmProviderWhereInput
    isNot?: LlmProviderWhereInput
  }

  export type LlmModelProviderIdModelNameCompoundUniqueInput = {
    providerId: string
    modelName: string
  }

  export type LlmModelCountOrderByAggregateInput = {
    id?: SortOrder
    providerId?: SortOrder
    modelName?: SortOrder
    displayName?: SortOrder
    isActive?: SortOrder
    config?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LlmModelMaxOrderByAggregateInput = {
    id?: SortOrder
    providerId?: SortOrder
    modelName?: SortOrder
    displayName?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LlmModelMinOrderByAggregateInput = {
    id?: SortOrder
    providerId?: SortOrder
    modelName?: SortOrder
    displayName?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserCreaterolesInput = {
    set: $Enums.UserRole[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type EnumUserStatusFieldUpdateOperationsInput = {
    set?: $Enums.UserStatus
  }

  export type UserUpdaterolesInput = {
    set?: $Enums.UserRole[]
    push?: $Enums.UserRole | $Enums.UserRole[]
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type LlmModelCreateNestedManyWithoutProviderInput = {
    create?: XOR<LlmModelCreateWithoutProviderInput, LlmModelUncheckedCreateWithoutProviderInput> | LlmModelCreateWithoutProviderInput[] | LlmModelUncheckedCreateWithoutProviderInput[]
    connectOrCreate?: LlmModelCreateOrConnectWithoutProviderInput | LlmModelCreateOrConnectWithoutProviderInput[]
    createMany?: LlmModelCreateManyProviderInputEnvelope
    connect?: LlmModelWhereUniqueInput | LlmModelWhereUniqueInput[]
  }

  export type LlmModelUncheckedCreateNestedManyWithoutProviderInput = {
    create?: XOR<LlmModelCreateWithoutProviderInput, LlmModelUncheckedCreateWithoutProviderInput> | LlmModelCreateWithoutProviderInput[] | LlmModelUncheckedCreateWithoutProviderInput[]
    connectOrCreate?: LlmModelCreateOrConnectWithoutProviderInput | LlmModelCreateOrConnectWithoutProviderInput[]
    createMany?: LlmModelCreateManyProviderInputEnvelope
    connect?: LlmModelWhereUniqueInput | LlmModelWhereUniqueInput[]
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type LlmModelUpdateManyWithoutProviderNestedInput = {
    create?: XOR<LlmModelCreateWithoutProviderInput, LlmModelUncheckedCreateWithoutProviderInput> | LlmModelCreateWithoutProviderInput[] | LlmModelUncheckedCreateWithoutProviderInput[]
    connectOrCreate?: LlmModelCreateOrConnectWithoutProviderInput | LlmModelCreateOrConnectWithoutProviderInput[]
    upsert?: LlmModelUpsertWithWhereUniqueWithoutProviderInput | LlmModelUpsertWithWhereUniqueWithoutProviderInput[]
    createMany?: LlmModelCreateManyProviderInputEnvelope
    set?: LlmModelWhereUniqueInput | LlmModelWhereUniqueInput[]
    disconnect?: LlmModelWhereUniqueInput | LlmModelWhereUniqueInput[]
    delete?: LlmModelWhereUniqueInput | LlmModelWhereUniqueInput[]
    connect?: LlmModelWhereUniqueInput | LlmModelWhereUniqueInput[]
    update?: LlmModelUpdateWithWhereUniqueWithoutProviderInput | LlmModelUpdateWithWhereUniqueWithoutProviderInput[]
    updateMany?: LlmModelUpdateManyWithWhereWithoutProviderInput | LlmModelUpdateManyWithWhereWithoutProviderInput[]
    deleteMany?: LlmModelScalarWhereInput | LlmModelScalarWhereInput[]
  }

  export type LlmModelUncheckedUpdateManyWithoutProviderNestedInput = {
    create?: XOR<LlmModelCreateWithoutProviderInput, LlmModelUncheckedCreateWithoutProviderInput> | LlmModelCreateWithoutProviderInput[] | LlmModelUncheckedCreateWithoutProviderInput[]
    connectOrCreate?: LlmModelCreateOrConnectWithoutProviderInput | LlmModelCreateOrConnectWithoutProviderInput[]
    upsert?: LlmModelUpsertWithWhereUniqueWithoutProviderInput | LlmModelUpsertWithWhereUniqueWithoutProviderInput[]
    createMany?: LlmModelCreateManyProviderInputEnvelope
    set?: LlmModelWhereUniqueInput | LlmModelWhereUniqueInput[]
    disconnect?: LlmModelWhereUniqueInput | LlmModelWhereUniqueInput[]
    delete?: LlmModelWhereUniqueInput | LlmModelWhereUniqueInput[]
    connect?: LlmModelWhereUniqueInput | LlmModelWhereUniqueInput[]
    update?: LlmModelUpdateWithWhereUniqueWithoutProviderInput | LlmModelUpdateWithWhereUniqueWithoutProviderInput[]
    updateMany?: LlmModelUpdateManyWithWhereWithoutProviderInput | LlmModelUpdateManyWithWhereWithoutProviderInput[]
    deleteMany?: LlmModelScalarWhereInput | LlmModelScalarWhereInput[]
  }

  export type LlmProviderCreateNestedOneWithoutModelsInput = {
    create?: XOR<LlmProviderCreateWithoutModelsInput, LlmProviderUncheckedCreateWithoutModelsInput>
    connectOrCreate?: LlmProviderCreateOrConnectWithoutModelsInput
    connect?: LlmProviderWhereUniqueInput
  }

  export type LlmProviderUpdateOneRequiredWithoutModelsNestedInput = {
    create?: XOR<LlmProviderCreateWithoutModelsInput, LlmProviderUncheckedCreateWithoutModelsInput>
    connectOrCreate?: LlmProviderCreateOrConnectWithoutModelsInput
    upsert?: LlmProviderUpsertWithoutModelsInput
    connect?: LlmProviderWhereUniqueInput
    update?: XOR<XOR<LlmProviderUpdateToOneWithWhereWithoutModelsInput, LlmProviderUpdateWithoutModelsInput>, LlmProviderUncheckedUpdateWithoutModelsInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedEnumUserStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.UserStatus | EnumUserStatusFieldRefInput<$PrismaModel>
    in?: $Enums.UserStatus[] | ListEnumUserStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserStatus[] | ListEnumUserStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumUserStatusFilter<$PrismaModel> | $Enums.UserStatus
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumUserStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.UserStatus | EnumUserStatusFieldRefInput<$PrismaModel>
    in?: $Enums.UserStatus[] | ListEnumUserStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserStatus[] | ListEnumUserStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumUserStatusWithAggregatesFilter<$PrismaModel> | $Enums.UserStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumUserStatusFilter<$PrismaModel>
    _max?: NestedEnumUserStatusFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type LlmModelCreateWithoutProviderInput = {
    id?: string
    modelName: string
    displayName?: string | null
    isActive?: boolean
    config?: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LlmModelUncheckedCreateWithoutProviderInput = {
    id?: string
    modelName: string
    displayName?: string | null
    isActive?: boolean
    config?: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LlmModelCreateOrConnectWithoutProviderInput = {
    where: LlmModelWhereUniqueInput
    create: XOR<LlmModelCreateWithoutProviderInput, LlmModelUncheckedCreateWithoutProviderInput>
  }

  export type LlmModelCreateManyProviderInputEnvelope = {
    data: LlmModelCreateManyProviderInput | LlmModelCreateManyProviderInput[]
    skipDuplicates?: boolean
  }

  export type LlmModelUpsertWithWhereUniqueWithoutProviderInput = {
    where: LlmModelWhereUniqueInput
    update: XOR<LlmModelUpdateWithoutProviderInput, LlmModelUncheckedUpdateWithoutProviderInput>
    create: XOR<LlmModelCreateWithoutProviderInput, LlmModelUncheckedCreateWithoutProviderInput>
  }

  export type LlmModelUpdateWithWhereUniqueWithoutProviderInput = {
    where: LlmModelWhereUniqueInput
    data: XOR<LlmModelUpdateWithoutProviderInput, LlmModelUncheckedUpdateWithoutProviderInput>
  }

  export type LlmModelUpdateManyWithWhereWithoutProviderInput = {
    where: LlmModelScalarWhereInput
    data: XOR<LlmModelUpdateManyMutationInput, LlmModelUncheckedUpdateManyWithoutProviderInput>
  }

  export type LlmModelScalarWhereInput = {
    AND?: LlmModelScalarWhereInput | LlmModelScalarWhereInput[]
    OR?: LlmModelScalarWhereInput[]
    NOT?: LlmModelScalarWhereInput | LlmModelScalarWhereInput[]
    id?: StringFilter<"LlmModel"> | string
    providerId?: StringFilter<"LlmModel"> | string
    modelName?: StringFilter<"LlmModel"> | string
    displayName?: StringNullableFilter<"LlmModel"> | string | null
    isActive?: BoolFilter<"LlmModel"> | boolean
    config?: JsonFilter<"LlmModel">
    createdAt?: DateTimeFilter<"LlmModel"> | Date | string
    updatedAt?: DateTimeFilter<"LlmModel"> | Date | string
  }

  export type LlmProviderCreateWithoutModelsInput = {
    id?: string
    name: string
    type: string
    baseUrl?: string | null
    apiKey?: string | null
    isActive?: boolean
    config?: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LlmProviderUncheckedCreateWithoutModelsInput = {
    id?: string
    name: string
    type: string
    baseUrl?: string | null
    apiKey?: string | null
    isActive?: boolean
    config?: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LlmProviderCreateOrConnectWithoutModelsInput = {
    where: LlmProviderWhereUniqueInput
    create: XOR<LlmProviderCreateWithoutModelsInput, LlmProviderUncheckedCreateWithoutModelsInput>
  }

  export type LlmProviderUpsertWithoutModelsInput = {
    update: XOR<LlmProviderUpdateWithoutModelsInput, LlmProviderUncheckedUpdateWithoutModelsInput>
    create: XOR<LlmProviderCreateWithoutModelsInput, LlmProviderUncheckedCreateWithoutModelsInput>
    where?: LlmProviderWhereInput
  }

  export type LlmProviderUpdateToOneWithWhereWithoutModelsInput = {
    where?: LlmProviderWhereInput
    data: XOR<LlmProviderUpdateWithoutModelsInput, LlmProviderUncheckedUpdateWithoutModelsInput>
  }

  export type LlmProviderUpdateWithoutModelsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    baseUrl?: NullableStringFieldUpdateOperationsInput | string | null
    apiKey?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    config?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LlmProviderUncheckedUpdateWithoutModelsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    baseUrl?: NullableStringFieldUpdateOperationsInput | string | null
    apiKey?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    config?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LlmModelCreateManyProviderInput = {
    id?: string
    modelName: string
    displayName?: string | null
    isActive?: boolean
    config?: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LlmModelUpdateWithoutProviderInput = {
    id?: StringFieldUpdateOperationsInput | string
    modelName?: StringFieldUpdateOperationsInput | string
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    config?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LlmModelUncheckedUpdateWithoutProviderInput = {
    id?: StringFieldUpdateOperationsInput | string
    modelName?: StringFieldUpdateOperationsInput | string
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    config?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LlmModelUncheckedUpdateManyWithoutProviderInput = {
    id?: StringFieldUpdateOperationsInput | string
    modelName?: StringFieldUpdateOperationsInput | string
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    config?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}