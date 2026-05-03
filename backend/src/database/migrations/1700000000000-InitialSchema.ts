import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1700000000000 implements MigrationInterface {
    name = 'InitialSchema1700000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Products Table (Single Table Inheritance)
        await queryRunner.query(`
            CREATE TABLE "products" (
                "id" SERIAL NOT NULL,
                "name" character varying(100) NOT NULL,
                "price" numeric(10,2) NOT NULL,
                "type" character varying NOT NULL,
                "dough_type" character varying(50),
                "size" character varying(20),
                "volume" numeric(5,2),
                CONSTRAINT "PK_products" PRIMARY KEY ("id")
            )
        `);

        // Employees Table
        await queryRunner.query(`
            CREATE TABLE "employees" (
                "id" SERIAL NOT NULL,
                "name" character varying(100) NOT NULL,
                "surname" character varying(100) NOT NULL,
                "role" character varying(50) NOT NULL,
                CONSTRAINT "PK_employees" PRIMARY KEY ("id")
            )
        `);

        // Orders Table
        await queryRunner.query(`
            CREATE TABLE "orders" (
                "id" SERIAL NOT NULL,
                "total_price" numeric(10,2) NOT NULL DEFAULT '0',
                "status" character varying(50) NOT NULL DEFAULT 'PENDING_PAYMENT',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_orders" PRIMARY KEY ("id")
            )
        `);

        // OrderItems Table
        await queryRunner.query(`
            CREATE TABLE "order_items" (
                "id" SERIAL NOT NULL,
                "order_id" integer NOT NULL,
                "product_id" integer NOT NULL,
                "quantity" integer NOT NULL DEFAULT '1',
                "unit_price" numeric(10,2) NOT NULL,
                "custom_note" character varying(255),
                CONSTRAINT "PK_order_items" PRIMARY KEY ("id")
            )
        `);

        // Payments Table
        await queryRunner.query(`
            CREATE TABLE "payments" (
                "id" SERIAL NOT NULL,
                "order_id" integer NOT NULL,
                "paid_sum" numeric(10,2) NOT NULL,
                "payment_state" character varying(50) NOT NULL,
                "type" character varying(50) NOT NULL,
                CONSTRAINT "PK_payments" PRIMARY KEY ("id")
            )
        `);

        // EmployeeOrders Table
        await queryRunner.query(`
            CREATE TABLE "employee_orders" (
                "order_id" integer NOT NULL,
                "cook_id" integer,
                "waiter_id" integer,
                CONSTRAINT "PK_employee_orders" PRIMARY KEY ("order_id")
            )
        `);

        // Foreign Keys
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_order_items_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_order_items_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_payments_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        
        await queryRunner.query(`ALTER TABLE "employee_orders" ADD CONSTRAINT "FK_employee_orders_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "employee_orders" ADD CONSTRAINT "FK_employee_orders_cook" FOREIGN KEY ("cook_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "employee_orders" ADD CONSTRAINT "FK_employee_orders_waiter" FOREIGN KEY ("waiter_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employee_orders" DROP CONSTRAINT "FK_employee_orders_waiter"`);
        await queryRunner.query(`ALTER TABLE "employee_orders" DROP CONSTRAINT "FK_employee_orders_cook"`);
        await queryRunner.query(`ALTER TABLE "employee_orders" DROP CONSTRAINT "FK_employee_orders_order"`);
        
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_payments_order"`);
        
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_order_items_product"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_order_items_order"`);
        
        await queryRunner.query(`DROP TABLE "employee_orders"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TABLE "order_items"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP TABLE "employees"`);
        await queryRunner.query(`DROP TABLE "products"`);
    }
}
