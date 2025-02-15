import type {
  DataTypes,
  FieldOptions,
  FieldProps,
  FieldType,
  FieldTypeString,
} from "../data-types.ts";

/** Add a model field to a table schema. */
export function addFieldToSchema(
  table: any,
  fieldOptions: FieldOptions,
) {
  const type = typeof fieldOptions.type === "string"
    ? fieldOptions.type
    : fieldOptions.type.type!;

  let instruction;

  if (typeof fieldOptions.type === "object") {
    if (fieldOptions.type.relationship) {
      const relationshipPKName = fieldOptions.type.relationship.model
        .getComputedPrimaryKey();

      const relationshipPKProps: FieldProps = fieldOptions.type.relationship
        .model
        .getComputedPrimaryProps();

      const relationshipPKType: FieldTypeString = fieldOptions.type.relationship
        .model
        .getComputedPrimaryType();

      if (relationshipPKType === "integer" || relationshipPKType === "bigInteger") {
        const foreignField = table[relationshipPKType](fieldOptions.name);

        if (!relationshipPKProps.allowNull) {
          foreignField.notNullable();
        }

        if (relationshipPKProps.autoIncrement) {
          foreignField.unsigned();
        }
      } else {
        table[relationshipPKType](fieldOptions.name);
      }

      table
        .foreign(fieldOptions.name)
        .references(
          fieldOptions.type.relationship.model
            .field(relationshipPKName),
        )
        .onDelete("CASCADE");

      return;
    }

    const fieldNameArgs: [string | number | (string | number)[]] = [
      fieldOptions.name,
    ];

    if (fieldOptions.type.length) {
      fieldNameArgs.push(fieldOptions.type.length);
    }

    if (fieldOptions.type.precision) {
      fieldNameArgs.push(fieldOptions.type.precision);
    }

    if (fieldOptions.type.scale) {
      fieldNameArgs.push(fieldOptions.type.scale);
    }

    if (fieldOptions.type.values) {
      fieldNameArgs.push(fieldOptions.type.values);
    }

    if (fieldOptions.type.autoIncrement) {
      instruction = fieldOptions.type.type === "bigInteger" ? table.bigincrements(fieldOptions.name) : table.increments(fieldOptions.name);
    } else {
      instruction = table[type](...fieldNameArgs);
    }

    if (fieldOptions.type.primaryKey) {
      instruction = instruction.primary(`constraint_${table._tableName}_${fieldOptions.name}_primary`);
    }

    if (fieldOptions.type.unique) {
      instruction = instruction.unique(`constraint_${table._tableName}_${fieldOptions.name}_unique`);
    }

    if (!fieldOptions.type.allowNull) {
      instruction = instruction.notNullable();
    }
  } else {
    instruction = table[type](fieldOptions.name);
  }

  if (typeof fieldOptions.type === "object" && fieldOptions.type.comment) {
    instruction.comment(fieldOptions.type.comment);
  }

  if (typeof fieldOptions.defaultValue !== "undefined") {
    instruction.defaultTo(fieldOptions.defaultValue);
  }
}
