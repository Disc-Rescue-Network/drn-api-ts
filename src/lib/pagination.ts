import 'reflect-metadata'

import { Type } from 'class-transformer'


export enum Order {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class PageOptions {
  readonly order: Order = Order.ASC

  @Type(() => Number)
  readonly page: number = 1

  @Type(() => Number)
  readonly pageSize: number = 10

  get offset(): number {
    return (this.page - 1) * this.pageSize
  }

  get limit(): number {
    return this.pageSize
  }
}

export class Page {
  readonly items: any[]

  readonly page: number

  readonly pageSize: number

  readonly totalItems: number

  readonly totalPages: number

  readonly hasPreviousPage: boolean

  readonly hasNextPage: boolean

  constructor(items: any[], totalItems: number, pageOptions: PageOptions) {
    this.items = items

    this.page = pageOptions.page
    this.pageSize = this.items.length <= pageOptions.pageSize ? this.items.length : pageOptions.pageSize

    this.totalItems = totalItems
    this.totalPages = this.pageSize ? Math.ceil(this.totalItems / this.pageSize) : 0

    this.hasPreviousPage = this.page > 1
    this.hasNextPage = this.page < this.totalPages
  }
}
