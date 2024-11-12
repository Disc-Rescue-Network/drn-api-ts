export default function () {
    const ExtractImageTextSchema = {
        type: 'object',
        required: [
            'image',
        ],
        properties: {
            image: {
                type: 'string',
                format: 'byte'
            },
        }
    }

    return {
        ExtractImageTextSchema
    }
}
