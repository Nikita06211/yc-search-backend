import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Company {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column()
    batch!: string;

    @Column({ nullable: true })
    industry?: string;

    @Column({ type: "text", nullable: true })
    description?: string;

    @Column({ nullable: true })
    website?: string;

    @Column({ type: "text", nullable: true })
    embedding?: string;
}

