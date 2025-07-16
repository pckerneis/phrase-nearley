class MacroExpander {
    constructor() {
        this.macros = new Map();
    }

    registerMacro(name, params, statements) {
        this.macros.set(name, { params, statements });
    }

    expandMacro(name, args) {
        const macro = this.macros.get(name);
        if (!macro) {
            throw new Error(`Macro '${name}' not found`);
        }

        // Create parameter mapping
        const paramValues = new Map();
        for (let i = 0; i < macro.params.length; i++) {
            paramValues.set(macro.params[i], args[i]);
        }

        // Clone and substitute parameters in statements
        return macro.statements.map(stmt => this.substituteParams(stmt, paramValues));
    }

    substituteParams(statement, paramValues) {
        const clone = { ...statement };
        
        // Handle different statement types
        switch (clone.type) {
            case 'fill':
                if (clone.value.includes('{') && clone.value.includes('}')) {
                    const paramName = clone.value.slice(1, -1);
                    clone.value = paramValues.get(paramName) || clone.value;
                }
                break;
            // Add other statement types as needed
        }

        return clone;
    }
}

module.exports = { MacroExpander };
