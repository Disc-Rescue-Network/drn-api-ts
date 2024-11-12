INVENTORY_TEMPLATES="dist/services/inventory/template"

[ -d "$INVENTORY_TEMPLATES" ] || mkdir -p "$INVENTORY_TEMPLATES"

cp src/services/inventory/template/*.hbs $INVENTORY_TEMPLATES
